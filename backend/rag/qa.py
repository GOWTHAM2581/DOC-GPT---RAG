"""
RAG Question Answering Module
- Uses OpenAI or Groq LLMs
- Strict context-only answering (anti-hallucination)
"""

from typing import Dict, List
import os
from dotenv import load_dotenv

load_dotenv()


class QuestionAnswerer:
    def __init__(
        self,
        vector_store,
        chunks_data: List[Dict],
        top_k: int = 3,
        use_llm: bool = True,
    ):
        self.vector_store = vector_store
        self.chunks_data = chunks_data
        self.top_k = top_k
        self.use_llm = use_llm

        if self.use_llm:
            self._init_llm()

    # -------------------------------
    # LLM INITIALIZATION (OPENAI & GROQ)
    # -------------------------------
    def _init_llm(self):
        try:
            # Try OpenAI First (only if key starts with sk-)
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key and openai_api_key.startswith("sk-"):
                from openai import OpenAI
                self.client = OpenAI(api_key=openai_api_key)
                self.llm_type = "openai"
                print("OpenAI LLM initialized (gpt-3.5-turbo)")
                return

            # Check Groq Key
            groq_api_key = os.getenv("GROQ_API_KEY") or (openai_api_key if openai_api_key and openai_api_key.startswith("gsk_") else None)
            
            if groq_api_key:
                from langchain_groq import ChatGroq
                self.llm = ChatGroq(
                    groq_api_key=groq_api_key,
                    model_name="llama3-8b-8192", # Correct model name for Groq
                    temperature=0.1,
                    max_tokens=512,
                )
                self.llm_type = "groq"
                print("Groq LLM initialized (llama-3.1-8b-instant)")
                return

            print("No valid LLM keys found. LLM disabled.")
            self.use_llm = False

        except Exception as e:
            print(f"Failed to initialize LLM: {e}")
            self.use_llm = False

    # -------------------------------
    # MAIN Q&A PIPELINE
    # -------------------------------
    def answer_question(self, question: str, history: List[Dict] = []) -> Dict:
        # Step 0: Context Aware Query Condensing
        # If the question is a follow-up (short), condense it into a standalone query
        search_query = question
        if history and len(question.split()) < 5:
            search_query = self._condense_question(question, history)
            print(f"Condensed Query: {search_query}")

        # Step 1: Vector search
        scores, indices = self.vector_store.search(search_query, self.top_k)

        if not scores or len(indices) == 0:
            return self._no_data_response(0.0)

        # Step 2: Build context
        context_chunks = []
        for score, item in zip(scores, indices):
            if isinstance(item, int):
                # FAISS: item is an index into self.chunks_data
                if item < len(self.chunks_data):
                    chunk = self.chunks_data[item]
                    context_chunks.append({
                        "text": chunk["text"],
                        "page": chunk["page"],
                        "score": float(score),
                    })
            else:
                # Supabase: item is the chunk object itself
                context_chunks.append({
                    "text": item.get("content") or item.get("text", ""),
                    "page": item.get("metadata", {}).get("page", 0) if "metadata" in item else item.get("page", 0),
                    "score": float(score),
                })

        confidence_score = max(scores)

        # Step 3: Answer generation
        if self.use_llm:
            # We pass the original question for the answer, or the condensed one?
            # Usually original is better for the conversational feel, 
            # but search_query is better for context.
            if self.llm_type == "openai":
                answer = self._generate_openai_answer(question, context_chunks)
            elif self.llm_type == "groq":
                answer = self._generate_llm_answer(question, context_chunks)
            else:
                answer = self._generate_fallback_answer(context_chunks)
        else:
            answer = self._generate_fallback_answer(context_chunks)

        return {
            "answer": answer,
            "has_relevant_data": True,
            "confidence_score": confidence_score,
            "source_chunks": context_chunks,
        }

    # -------------------------------
    # QUERY CONDENSING (MEMORY)
    # -------------------------------
    def _condense_question(self, question: str, history: List[Dict]) -> str:
        """
        Uses LLM to rewrite a short follow-up question into a standalone search query.
        Example: "example" -> "Examples of eye-tracking technology in VR"
        """
        if not self.use_llm:
            return question

        # Format history for the prompt
        chat_context = ""
        for msg in history[-3:]: # Look at last 3 messages
            role = "User" if msg.get("role") == "user" or msg.get("type") == "user" else "Assistant"
            content = msg.get("content", "")
            chat_context += f"{role}: {content}\n"

        prompt = f"""
Given the following conversation history and a follow-up question, rewrite the follow-up question to be a standalone search query that can be used to search a document.

Conversation History:
{chat_context}

Follow-up Question: {question}

Standalone Query:"""

        try:
            if self.llm_type == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0,
                    max_tokens=50
                )
                return response.choices[0].message.content.strip()
            elif self.llm_type == "groq":
                # Use a very fast model for condensing
                response = self.llm.invoke([{"role": "user", "content": prompt}])
                return response.content.strip()
        except Exception as e:
            print(f"Condensing failed: {e}")
            return question
        
        return question

    # -------------------------------
    # OPENAI ANSWER GENERATION
    # -------------------------------
    def _generate_openai_answer(
        self, question: str, context_chunks: List[Dict]
    ) -> str:
        context_text = "\n\n".join(
            [
                f"[Page {chunk['page']}]\n{chunk['text']}"
                for chunk in context_chunks
            ]
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a precise document-focused assistant. "
                            "Answer strictly based on the provided context. "
                            "Do NOT use external knowledge. Be direct and concise. "
                            "Cite page numbers in brackets like [Page X]."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context_text}\n\nQuestion: {question}\n\nAnswer:"
                    }
                ],
                temperature=0,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Error: {e}")
            return self._generate_fallback_answer(context_chunks)

    # -------------------------------
    # GROQ ANSWER GENERATION
    # -------------------------------
    def _generate_llm_answer(
        self, question: str, context_chunks: List[Dict]
    ) -> str:
        context_text = "\n\n".join(
            [
                f"[Page {chunk['page']}]\n{chunk['text']}"
                for chunk in context_chunks
            ]
        )

        system_prompt = (
            "You are a precise document-based Q&A assistant.\n"
            "RULES:\n"
            "1. Answer ONLY using the provided context. If the information is not there, say: 'No relevant information found in the document.'\n"
            "2. Do NOT use external knowledge or provide conversational filler.\n"
            "3. Provide ONLY the answer asked for. Be extremely direct.\n"
            "4. Cite page numbers at the end of your answer in brackets like [Page X].\n"
        )

        user_prompt = f"Context:\n{context_text}\n\nQuestion: {question}\n\nAnswer strictly from context:"

        try:
            response = self.llm.invoke(
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
            )
            return response.content

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return self._generate_fallback_answer(context_chunks)

    # -------------------------------
    # FALLBACK (NO LLM)
    # -------------------------------
    def _generate_fallback_answer(self, context_chunks: List[Dict]) -> str:
        # User-friendly fallback when no LLM is connected
        summary = "### 📄 Relevant Excerpts Found:\n\n"
        for i, chunk in enumerate(context_chunks, 1):
             text_preview = chunk['text'].replace('\n', ' ').strip()
             summary += f"**{i}. Page {chunk['page']}**\n> \"{text_preview}\"\n\n"
        
        return summary

    # -------------------------------
    # NO DATA RESPONSE
    # -------------------------------
    def _no_data_response(self, confidence: float) -> Dict:
        return {
            "answer": "No relevant information found in the uploaded document.",
            "has_relevant_data": False,
            "confidence_score": confidence,
            "source_chunks": [],
        }
