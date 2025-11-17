import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AjudaPage.css';
import Header from '../../components/styles/Header';

// --- DADOS PARA A PÁGINA DE AJUDA ---

const faqCategories = [
  {
    category: 'Navegação e Rotas',
    icon: 'fa-route',
    faqs: [
      {
        question: 'Como traçar uma rota para um local?',
        answer: 'Vá para a página do Mapa, use a barra de busca para encontrar seu destino e clique em "Traçar Rota". Se preferir, clique diretamente em um ponto de interesse no mapa para ver as opções.',
      },
      {
        question: 'Posso criar rotas acessíveis, sem escadas?',
        answer: 'Sim! Nas Configurações (acessível pelo menu no mapa), ative a opção "Modo Acessibilidade" ou "Evitar Escadas" para que o Gnomon calcule a melhor rota para você.',
      },
      {
        question: 'Como limpar uma rota existente?',
        answer: 'Quando uma rota estiver ativa no mapa, um botão "Limpar Rota" aparecerá no canto inferior. Clique nele para remover a rota atual e poder traçar uma nova.',
      },
    ],
  },
  {
    category: 'Mapa 2D e 3D',
    icon: 'fa-map',
    faqs: [
        {
            question: 'Qual a diferença entre o mapa 2D e 3D?',
            answer: 'O mapa 2D oferece uma visão de cima, similar a uma planta baixa, ideal para traçar rotas rápidas. O modo 3D oferece uma visualização imersiva do campus, ajudando no reconhecimento do ambiente.',
        },
        {
            question: 'O modo 3D funciona em todos os celulares?',
            answer: 'O modo 3D exige mais do seu aparelho. Em celulares mais antigos, ele pode ser lento. Recomendamos usar o modo 2D para uma experiência mais fluida se você notar lentidão.',
        },
    ]
  },
  {
    category: 'Conta e Perfil',
    icon: 'fa-user',
    faqs: [
        {
            question: 'Preciso de uma conta para usar o Gnomon?',
            answer: 'Não! O Gnomon é de acesso livre para todos. O perfil é apenas para gerenciamento dos pontos do mapa atualmente e não é necessário para a navegação.',
        },
    ]
  }
];

const quickGuides = [
    {
        title: 'Traçando sua Primeira Rota',
        icon: 'fa-person-hiking',
        steps: [
            'Abra o Mapa a partir da tela inicial.',
            'Use a barra de busca para encontrar seu destino (ex: "Biblioteca").',
            'Selecione o destino na lista de resultados.',
            'O Gnomon irá exibir a rota no mapa. Siga a linha azul!',
        ]
    },
    {
        title: 'Alternando entre 2D e 3D',
        icon: 'fa-layer-group',
        steps: [
            'Na página do Mapa, localize a barra de busca no topo.',
            'No canto direito da barra de busca, você verá os botões "2D" e "3D".',
            'Clique no modo que deseja visualizar.',
            'A visualização do mapa mudará instantaneamente.',
        ]
    }
]

// --- COMPONENTE DA PÁGINA ---

export function AjudaPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) {
      return faqCategories;
    }
    
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return faqCategories
      .map(category => {
        const filteredFaqs = category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(lowercasedFilter) ||
            faq.answer.toLowerCase().includes(lowercasedFilter)
        );
        
        return { ...category, faqs: filteredFaqs };
      })
      .filter(category => category.faqs.length > 0);
  }, [searchTerm]);

  const handleToggleFaq = (question: string) => {
    setOpenFaq(openFaq === question ? null : question);
  };

  return (
    <div className="ajuda-page-container">
      <Header />
      <main className="ajuda-main-content">
        <button onClick={() => navigate('/mapa')} className="back-to-map-btn">
          <i className="fa-solid fa-arrow-left"></i> Voltar para o Mapa
        </button>

        <div className="ajuda-header">
          <h1>❔ Central de Ajuda</h1>
          <p>Tudo o que você precisa saber para navegar pelo campus como um profissional.</p>
        </div>

        {/* --- BARRA DE BUSCA --- */}
        <div className="search-container">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="O que você está procurando? (ex: rota, 3D, escadas...)"
            className="search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- GUIAS RÁPIDOS --- */}
        <section className="ajuda-section">
            <h2 className="section-title">
                <i className="fa-solid fa-rocket"></i> Guias Rápidos
            </h2>
            <div className="guides-grid">
                {quickGuides.map(guide => (
                    <div key={guide.title} className="guide-card">
                        <div className="guide-card-header">
                            <i className={`fa-solid ${guide.icon}`}></i>
                            <h3>{guide.title}</h3>
                        </div>
                        <ol className="guide-steps">
                            {guide.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </section>

        {/* --- FAQs --- */}
        <section className="ajuda-section">
            <h2 className="section-title">
                <i className="fa-solid fa-circle-question"></i> Perguntas Frequentes
            </h2>
            <div className="faq-container">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                        <div key={cat.category} className="faq-category">
                            <h3><i className={`fa-solid ${cat.icon}`}></i> {cat.category}</h3>
                            {cat.faqs.map(faq => (
                                <div key={faq.question} className="faq-item">
                                    <button
                                        className="faq-question"
                                        onClick={() => handleToggleFaq(faq.question)}
                                        aria-expanded={openFaq === faq.question}
                                    >
                                        <span>{faq.question}</span>
                                        <i className={`fa-solid fa-chevron-down ${openFaq === faq.question ? 'open' : ''}`}></i>
                                    </button>
                                    {openFaq === faq.question && (
                                        <div className="faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <i className="fa-solid fa-ghost"></i>
                        <h3>Nenhum resultado encontrado</h3>
                        <p>Tente usar termos de busca diferentes.</p>
                    </div>
                )}
            </div>
        </section>
      </main>
    </div>
  );
}
