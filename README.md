# ⚖️ RAG-Based Legal Assistant Chatbot

A **context-aware legal assistant** built using **LangChain** and an advanced **Retrieval-Augmented Generation (RAG)** pipeline.  
The system answers legal questions by grounding responses in relevant legal documents using **hybrid retrieval** and **query-aware reasoning**.

---

## 🚀 Why this project?

Most legal chatbots fail because they:
- retrieve duplicate or irrelevant context
- rely on a single retrieval strategy
- break on complex, multi-document questions

This project fixes that.

---

## 🧠 Core Features

- 📄 **PDF Ingestion** – Parses and indexes legal PDF documents  
- 🔎 **Hybrid Retrieval**
  - **BM25** for exact keyword matches  
  - **FAISS + embeddings** for semantic search  
- 🧩 **Query Complexity Detection** – Adapts retrieval strategy automatically  
- 🔁 **Multi-Query Retrieval** – Expands queries to improve recall  
- 🪜 **Multi-Hop Retrieval** – Chains information across documents  
- 🧮 **Reciprocal Rank Fusion (RRF)** – Merges results from multiple retrievers  
- 💬 **Conversation Awareness** – Custom chat history handling  
- ⚠️ **Legal Disclaimer** – Responses are not legal advice  

---

## 🛠️ Tech Stack

| Component | Technology |
|--------|------------|
| Framework | LangChain |
| Embeddings | all-MiniLM-L6-v2 |
| Vector Store | FAISS |
| Sparse Search | BM25 |
| LLM | Cohere (command-r) |
| Evaluation | RAGAS |
| Tracing | LangSmith |
| Interface | CLI |

---

## 📂 Project Structure

RAG-based-Legal-Assistant/
├── data/ # Legal PDFs
├── modules/ # Core RAG logic
│ ├── bm25_retriever.py
│ ├── semantic_retriever.py
│ ├── multi_query_retriever.py
│ ├── multi_hop_retriever.py
│ ├── rrf_score.py
│ ├── conversation_history.py
│ └── chatbot_response.py
├── prompts/
├── RAGAS-dataset/
├── app.py
└── README.md


---

## ⚙️ Setup

### Requirements
```bash
python >= 3.12
Installation (Recommended)
git clone https://github.com/RISHABH-PAWAR/RAG-based-Legal-Assistant.git
cd RAG-based-Legal-Assistant
uv sync

🔐 Environment Variables
Create a .env file:

COHERE_API_KEY=your_api_key
OPENAI_API_KEY=optional

▶️ Run the App
uv run app.py
Ask legal questions in the terminal.
Type exit to quit.
```

🧪 Evaluation
Retrieval and generation quality are evaluated using RAGAS.
Scores and datasets are available in RAGAS-dataset/.

👤 Author
Rishabh Pawar
🔗 https://github.com/RISHABH-PAWAR


