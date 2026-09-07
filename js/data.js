/**
 * data.js — Single source of truth for all portfolio content.
 * Edit this file to update skills, experience, projects, and honors.
 */

const DATA = {

  skills: [
    { index: '01', name: 'Python',    desc: 'Primary language — scripting, ML, backend systems' },
    { index: '02', name: 'FastAPI',   desc: 'High-performance async APIs for AI services' },
    { index: '03', name: 'LangGraph', desc: 'Stateful, graph-orchestrated agent workflows' },
    { index: '04', name: 'LangChain', desc: 'LLM pipelines, tools, chains & memory' },
    { index: '05', name: 'RAG',       desc: 'Retrieval-augmented generation architectures' },
    { index: '06', name: 'ChromaDB',  desc: 'Vector stores & semantic search' },
    { index: '07', name: 'Supabase',  desc: 'Postgres, auth & realtime backends' },
    { index: '08', name: 'React',     desc: 'Interactive frontends & dashboards' },
  ],

  experience: [
    {
      type: 'Research',
      title: 'Research Intern — ML / IDS',
      org:   'MNNIT Allahabad',
      bullets: [
        'Applied machine learning to network intrusion detection systems',
        'Explored classification pipelines and anomaly-detection techniques on real traffic data',
      ],
    },
    {
      type: 'Internship',
      title: 'ML Intern',
      org:   'Codveda',
      bullets: [
        'Built and evaluated ML models across supervised learning tasks',
        'Shipped data preprocessing, training and evaluation workflows end to end',
      ],
    },
    {
      type: 'Community',
      title: 'Campus Ambassador',
      org:   'Mindenious Edutech',
      bullets: [
        'Represented the platform across campus, driving student outreach and engagement',
        'Organized workshops and knowledge-sharing sessions for peers',
      ],
    },
  ],

  projects: [
    {
      cat:   'Agentic Commerce',
      title: 'RazorFlow AI',
      desc:  'An agentic commerce platform where autonomous LangGraph agents orchestrate Razorpay payment workflows — intent to transaction, with minimal human touch.',
      tags:  ['LangGraph', 'Razorpay', 'FastAPI'],
      url:   'https://github.com/VeerGetGit/RazorPay_agentic_checkout',
    },
    {
      cat:   'College Assistant',
      title: 'Agentic RAG ChatBot',
      desc:  'A college assistant powered by retrieval-augmented generation — LangChain chains over ChromaDB vector memory to answer campus queries with grounded context.',
      tags:  ['LangChain', 'ChromaDB', 'React'],
      url:   'https://github.com/VeerGetGit/Agentic_Rag_chatBot',
    },
    {
      cat: 'AI / Full Stack',
      title: 'HCP CRM',
      desc: 'An AI-powered CRM that uses a LangGraph ReAct agent with custom tools to automate interaction logging and workflows — built as a full-stack application.',
      tags: ['Python', 'FastAPI', 'LangGraph', 'React', 'Supabase'],
      url: 'https://github.com/VeerGetGit/HCP_CRM',
    },
  ],

  honors: [
    {
      title: 'HackQuest Top Finalist',
      desc:  'Reached the top finalist cohort at HackQuest, shipping an agentic product under hackathon pressure.',
    },
    {
      title: 'SIH Round 2 Qualifier',
      desc:  "Qualified for Round 2 of Smart India Hackathon — India's largest national innovation challenge.",
    },
    {
      title: 'Ad Mania Winner',
      desc:  'First place at Ad Mania — a creative advertising and strategy competition.',
    },
  ],

};
