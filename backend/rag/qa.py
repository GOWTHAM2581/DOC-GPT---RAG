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
        top_k: int = 15,
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
                    model_name="llama-3.1-8b-instant", # Correct model name for Groq
                    temperature=0.1,
                    max_tokens=512,
                )
                self.llm_type = "groq"
                print("Groq LLM initialized (llama-3.1-8b-instant) [V2 - Consolidated]")
                return

            print("No valid LLM keys found. LLM disabled.")
            self.use_llm = False

        except Exception as e:
            print(f"Failed to initialize LLM: {e}")
            self.use_llm = False

    # -------------------------------
    # MAIN Q&A PIPELINE
    # -------------------------------
    def answer_question(self, question: str, history: List[Dict] = [], tenant_id: str = "default") -> Dict:
        # Step 0: Context Aware Query Condensing
        search_query = question
        if history and len(question.split()) < 5:
            search_query = self._condense_question(question, history)
            print(f"Condensed Query: {search_query}")

        # Step 1: Vector search
        scores, indices = self.vector_store.search(search_query, self.top_k, tenant_id=tenant_id)

        if not scores or len(indices) == 0:
            return self._no_data_response(0.0)

        # Step 2: Build context
        context_chunks = []
        for score, item in zip(scores, indices):
            if isinstance(item, int):
                if item < len(self.chunks_data):
                    chunk = self.chunks_data[item]
                    context_chunks.append({
                        "text": chunk["text"],
                        "page": chunk["page"],
                        "score": float(score),
                    })
            else:
                context_chunks.append({
                    "text": item.get("content") or item.get("text", ""),
                    "page": item.get("metadata", {}).get("page", 0) if "metadata" in item else item.get("page", 0),
                    "score": float(score),
                })

        confidence_score = max(scores)

        # Step 3: Answer generation (LLM or Fallback)
        is_fallback = False
        if self.use_llm:
            if self.llm_type == "openai":
                llm_answer = self._generate_openai_answer(question, context_chunks)
            elif self.llm_type == "groq":
                llm_answer = self._generate_llm_answer(question, context_chunks)
            else:
                llm_answer = self._generate_fallback_answer(context_chunks)
                is_fallback = True
        else:
            llm_answer = self._generate_fallback_answer(context_chunks)
            is_fallback = True

        # Step 4: Format the final response
        # Structure: Natural Answer ONLY (Metadata handled separately by frontend)
        
        if is_fallback:
            final_answer = "### Relevant Excerpts Found\n\n" + llm_answer
        else:
            # Clean conversational answer
            final_answer = llm_answer

        return {
            "answer": final_answer,
            "has_relevant_data": True,
            "confidence_score": confidence_score,
            "source_chunks": context_chunks,
        }

    def _summarize_user_question(self, question: str) -> str:
        """Generates a concise summary of the user's question."""
        if not self.use_llm:
            return f"Analyzing your request regarding: '{question}'"

        prompt = f"Summarize what the user is asking in one short, professional sentence (starting with 'You are asking about...'):\n\nQuestion: {question}"
        
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
                response = self.llm.invoke([{"role": "user", "content": prompt}])
                return response.content.strip()
        except Exception as e:
            print(f"Summary generation failed: {e}")
            return f"You are asking about: {question}"
        
        return f"You are asking about: {question}"

    # -------------------------------
    # QUERY CONDENSING (MEMORY)
    # -------------------------------
    def _condense_question(self, question: str, history: List[Dict]) -> str:
        if not self.use_llm:
            return question

        chat_context = ""
        for msg in history[-3:]:
            role = "User" if msg.get("role") == "user" or msg.get("type") == "user" else "Assistant"
            content = msg.get("content", "")
            chat_context += f"{role}: {content}\n"

        prompt = f"""
Given the conversation history and follow-up, rewrite it as a standalone search query.
History:
{chat_context}
Follow-up: {question}
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
                response = self.llm.invoke([{"role": "user", "content": prompt}])
                return response.content.strip()
        except Exception as e:
            return question
        
        return question

    # -------------------------------
    # OPENAI ANSWER GENERATION
    # -------------------------------
    def _generate_openai_answer(
        self, question: str, context_chunks: List[Dict]
    ) -> str:
        context_text = "\n\n".join(
            [chunk['text'] for chunk in context_chunks]
        ).replace("_", " ")

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful and professional document-based assistant. "
                            "CONSOLIDATE the information from the provided context into a coherent, "
                            "easy-to-read answer. Summarize the key points like ChatGPT would. "
                            "NEVER include page numbers, citations, brackets like [Page X], or technical field names like 'Product_ID' in your response. "
                            "NEVER include underscores (_) in your response; convert technical keys like 'Total_Height' into natural spaces like 'Total Height'."
                        ).replace("_", " ")
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context_text}\n\nQuestion: {question}\n\nConsolidated Answer:"
                    }
                ],
                temperature=0.3, # Slightly higher for better flow
            ).choices[0].message.content
            return response.replace("_", " ")
        except Exception as e:
            return self._generate_fallback_answer(context_chunks).replace("_", " ")

    # -------------------------------
    # GROQ ANSWER GENERATION
    # -------------------------------
    def _generate_llm_answer(
        self, question: str, context_chunks: List[Dict]
    ) -> str:
        context_text = "\n\n".join(
            [chunk['text'] for chunk in context_chunks]
        ).replace("_", " ")

        system_prompt = (
            "You are a highly analytical, helpful, and professional document-based assistant.\n"
            "GOAL: Provide a comprehensive, accurate, and conversational answer based strictly on the provided context.\n"
            "ANALYSIS RULES:\n"
            "1. BE EXHAUSTIVE: If the user asks for 'available sizes' or 'list of items', scan ALL provided context chunks to find EVERY mention. Do not stop after the first few.\n"
            "2. CONNECT THE DOTS: Compare data across different chunks to provide a consolidated and synthesized response.\n"
            "3. STRICT CONTEXT: Only use the provided context. If not found, state 'I'm sorry, but I couldn't find information about that in the document.'\n"
            "4. NO TECHNICAL NOISE: Do not include internal field names like 'Product_ID', 'Product_Label', or 'Metadata'. Replace any technical names with natural language. For example, if you see 'Total_Height_Of_Valve', convert it to 'Total Height of Valve'. NEVER include underscores (_) in your final response.\n"
            "5. NO CITATIONS: NEVER include page numbers, brackets like [Page X], or any references to the source document in your final response. The user should not see any technical metadata or page counts.\n"
            "6. Explain the reasoning clearly if the user asks 'why' or 'how'.\n"
            "7. Maintain a helpful and supportive tone."
        )

        user_prompt = f"Context:\n{context_text}\n\nQuestion: {question}\n\nAnswer:"

        try:
            response = self.llm.invoke(
                [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ]
            )
            return response.content.replace("_", " ")

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return self._generate_fallback_answer(context_chunks)

    # -------------------------------
    # FALLBACK (NO LLM)
    # -------------------------------
    def _generate_fallback_answer(self, context_chunks: List[Dict]) -> str:
        summary = ""
        for i, chunk in enumerate(context_chunks, 1):
             text_preview = chunk['text'].replace('\n', ' ').strip()[:300] + "..."
             summary += f"{i}. **Page {chunk['page']}**: {text_preview}\n"
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
