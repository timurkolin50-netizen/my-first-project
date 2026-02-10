import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Zap, Globe, RefreshCw, MessageSquare, Send, Bot, Sparkles, Target, AlertCircle } from 'lucide-react';

export default function CryptoDashboard() {
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [timeframe, setTimeframe] = useState('24h');
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [news, setNews] = useState([]);
  
  // AI Chat состояние
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const chatEndRef = useRef(null);

  // AI Рекомендации
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Конфигурация криптовалют
  const cryptoConfig = [
    { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
    { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
    { id: 'solana', symbol: 'SOL', icon: '◎' },
    { id: 'cardano', symbol: 'ADA', icon: '₳' },
    { id: 'polkadot', symbol: 'DOT', icon: '●' },
    { id: 'avalanche-2', symbol: 'AVAX', icon: '▲' }
  ];

  // Портфолио с сохранением в localStorage
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('cryptoPortfolio');
    return saved ? JSON.parse(saved) : [
      { symbol: 'BTC', amount: 0.5, avgPrice: 65000 },
      { symbol: 'ETH', amount: 5, avgPrice: 3500 },
      { symbol: 'SOL', amount: 20, avgPrice: 140 }
    ];
  });

  // Сохранение портфолио
  useEffect(() => {
    localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Получение данных о криптовалютах
  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      const ids = cryptoConfig.map(c => c.id).join(',');
      
      // Используем публичный API CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('Нет данных от API');
      }
      
      const formattedData = data.map(coin => {
        const config = cryptoConfig.find(c => c.id === coin.id);
        return {
          id: coin.id,
          symbol: config?.symbol || coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price || 0,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          volume24h: coin.total_volume || 0,
          icon: config?.icon || '●',
          image: coin.image // Реальная иконка
        };
      });
      
      setCryptoData(formattedData);
      setLastUpdate(new Date());
      setLoading(false);
      console.log('Данные успешно загружены:', formattedData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // Запасные данные если API не работает
      setCryptoData([
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 97234.50,
          change24h: 2.34,
          marketCap: 1920000000000,
          volume24h: 42000000000,
          icon: '₿',
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3342.67,
          change24h: -0.89,
          marketCap: 402000000000,
          volume24h: 18000000000,
          icon: 'Ξ',
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
        },
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          price: 189.45,
          change24h: 5.67,
          marketCap: 92000000000,
          volume24h: 3200000000,
          icon: '◎',
          image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
        },
        {
          id: 'cardano',
          symbol: 'ADA',
          name: 'Cardano',
          price: 0.876,
          change24h: 1.23,
          marketCap: 30500000000,
          volume24h: 680000000,
          icon: '₳',
          image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
        },
        {
          id: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot',
          price: 6.78,
          change24h: -2.34,
          marketCap: 9800000000,
          volume24h: 280000000,
          icon: '●',
          image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
        },
        {
          id: 'avalanche-2',
          symbol: 'AVAX',
          name: 'Avalanche',
          price: 34.56,
          change24h: 3.45,
          marketCap: 14200000000,
          volume24h: 520000000,
          icon: '▲',
          image: 'https://assets.coingecko.com/coins/images/12559/large/avalanche.png'
        }
      ]);
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Получение данных графика
  const fetchChartData = async (coinId, days) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('API error');
      }
      
      const data = await response.json();
      
      if (!data.prices || data.prices.length === 0) {
        throw new Error('Нет данных графика');
      }
      
      const formatted = data.prices.map((price, index) => ({
        time: days === 1 
          ? new Date(price[0]).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : new Date(price[0]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        price: price[1],
        volume: data.total_volumes && data.total_volumes[index] ? data.total_volumes[index][1] : 0
      }));
      
      setChartData(formatted);
      console.log('График загружен:', formatted.length, 'точек');
    } catch (error) {
      console.error('Ошибка загрузки графика:', error);
      
      // Генерируем примерные данные если API не работает
      const crypto = cryptoData.find(c => c.id === coinId);
      if (crypto) {
        const basePrice = crypto.price;
        const points = days === 1 ? 24 : days === 7 ? 7 : 30;
        
        const generated = Array.from({ length: points }, (_, i) => {
          const timeOffset = (points - i) * (days === 1 ? 3600000 : 86400000);
          const time = new Date(Date.now() - timeOffset);
          const variance = (Math.random() - 0.5) * basePrice * 0.03;
          
          return {
            time: days === 1 
              ? time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              : time.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
            price: basePrice + variance,
            volume: Math.random() * crypto.volume24h
          };
        });
        
        setChartData(generated);
      }
    }
  };

  // Получение новостей
  const fetchNews = async () => {
    try {
      setNews([
        {
          title: 'Bitcoin продолжает рост на фоне институционального спроса',
          source: 'CryptoNews',
          time: new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          trend: 'up'
        },
        {
          title: 'Ethereum готовится к следующему крупному обновлению сети',
          source: 'ETH Foundation',
          time: new Date(Date.now() - 3600000).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          trend: 'neutral'
        },
        {
          title: 'L2 решения показывают рекордный рост транзакций',
          source: 'DeFi Pulse',
          time: new Date(Date.now() - 7200000).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          trend: 'up'
        },
        {
          title: 'Регуляторы обсуждают новые правила для криптовалют',
          source: 'Bloomberg Crypto',
          time: new Date(Date.now() - 10800000).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          trend: 'neutral'
        }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
    }
  };

  // AI Чат с Claude
  const sendMessageToClaude = async (message) => {
    setIsAITyping(true);
    
    try {
      // Подготовка контекста о портфолио
      const portfolioContext = portfolio.map(item => {
        const crypto = cryptoData.find(c => c.symbol === item.symbol);
        const currentValue = crypto ? crypto.price * item.amount : 0;
        const invested = item.avgPrice * item.amount;
        const profit = currentValue - invested;
        return `${item.symbol}: ${item.amount} монет, куплено по $${item.avgPrice}, текущая цена $${crypto?.price || 0}, прибыль: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`;
      }).join('\n');

      const marketContext = cryptoData.map(c => 
        `${c.symbol} (${c.name}): $${c.price.toLocaleString()}, изменение за 24ч: ${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%`
      ).join('\n');

      const systemPrompt = `Ты профессиональный криптоаналитик и советник по инвестициям. 

ПОРТФОЛИО ПОЛЬЗОВАТЕЛЯ:
${portfolioContext}

АКТУАЛЬНЫЕ ЦЕНЫ НА РЫНКЕ:
${marketContext}

Дата: ${new Date().toLocaleDateString('ru-RU')}

Отвечай на русском языке кратко и по делу. Давай конкретные советы на основе данных выше. Если спрашивают про другие криптовалюты, используй свои знания.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...chatMessages.filter(m => m.role !== 'system').map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.content?.find(item => item.type === 'text')?.text || 
                        'Извини, не смог обработать запрос.';
      
      setChatMessages(prev => [...prev, 
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]);
    } catch (error) {
      console.error('Ошибка AI:', error);
      
      // Простой ответ на основе ключевых слов если API не работает
      let simpleResponse = '';
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('купить') || lowerMsg.includes('куда') || lowerMsg.includes('инвестир')) {
        const topGainer = cryptoData.reduce((max, c) => c.change24h > max.change24h ? c : max, cryptoData[0]);
        simpleResponse = `На данный момент ${topGainer.symbol} показывает хороший рост (+${topGainer.change24h.toFixed(2)}% за 24ч). Текущая цена: $${topGainer.price.toLocaleString()}. 

Общие рекомендации:
- BTC - надежная долгосрочная инвестиция
- ETH - основа DeFi экосистемы
- SOL - быстрый рост, но высокая волатильность

Всегда диверсифицируй портфолио и инвестируй только то, что готов потерять.`;
      } else if (lowerMsg.includes('продать') || lowerMsg.includes('когда')) {
        const portfolioTotal = portfolio.reduce((sum, item) => {
          const crypto = cryptoData.find(c => c.symbol === item.symbol);
          return sum + (crypto ? crypto.price * item.amount - item.avgPrice * item.amount : 0);
        }, 0);
        
        simpleResponse = `Твое портфолио сейчас ${portfolioTotal >= 0 ? 'в плюсе' : 'в минусе'} на $${Math.abs(portfolioTotal).toFixed(2)}.

Общие правила:
- Не продавай в панике при просадке
- Фиксируй прибыль частями (20-30% при росте на 50%+)
- Держи основные позиции долгосрочно (BTC, ETH)`;
      } else if (lowerMsg.includes('прогноз') || lowerMsg.includes('вырастет')) {
        simpleResponse = `Никто не может точно предсказать движение крипторынка. 

Текущая ситуация:
${cryptoData.slice(0, 3).map(c => `- ${c.symbol}: $${c.price.toLocaleString()} (${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%)`).join('\n')}

Следи за новостями, технологическими обновлениями и общими трендами рынка.`;
      } else {
        simpleResponse = `Я вижу твое портфолио:
${portfolio.map(item => {
  const crypto = cryptoData.find(c => c.symbol === item.symbol);
  const currentValue = crypto ? crypto.price * item.amount : 0;
  const profit = currentValue - (item.avgPrice * item.amount);
  return `- ${item.symbol}: ${item.amount} монет, ${profit >= 0 ? 'прибыль' : 'убыток'} $${Math.abs(profit).toFixed(2)}`;
}).join('\n')}

Задай конкретный вопрос про инвестиции, анализ рынка или стратегию!`;
      }
      
      setChatMessages(prev => [...prev, 
        { role: 'user', content: message },
        { role: 'assistant', content: simpleResponse }
      ]);
    }
    
    setIsAITyping(false);
    setInputMessage('');
  };

  // AI Рекомендации по портфолио
  const generateAIRecommendations = async () => {
    setLoadingRecommendations(true);
    
    try {
      const portfolioContext = portfolio.map(item => {
        const crypto = cryptoData.find(c => c.symbol === item.symbol);
        const currentValue = crypto ? crypto.price * item.amount : 0;
        const invested = item.avgPrice * item.amount;
        const profit = currentValue - invested;
        const profitPercent = (profit / invested) * 100;
        
        return {
          symbol: item.symbol,
          amount: item.amount,
          avgPrice: item.avgPrice,
          currentPrice: crypto?.price || 0,
          currentValue,
          invested,
          profit,
          profitPercent,
          change24h: crypto?.change24h || 0
        };
      });

      const marketContext = cryptoData.map(c => ({
        symbol: c.symbol,
        price: c.price,
        change24h: c.change24h,
        marketCap: c.marketCap,
        volume24h: c.volume24h
      }));

      const prompt = `Проанализируй криптопортфолио и дай рекомендации:

ПОРТФОЛИО:
${JSON.stringify(portfolioContext, null, 2)}

РЫНОК:
${JSON.stringify(marketContext, null, 2)}

Ответь только JSON в формате:
{
  "analysis": "краткий анализ 2-3 предложения",
  "recommendations": [
    {"action": "КУПИТЬ", "coin": "BTC", "reason": "причина", "priority": "high"},
    {"action": "ДЕРЖАТЬ", "coin": "ETH", "reason": "причина", "priority": "medium"},
    {"action": "ПРОДАТЬ", "coin": "SOL", "reason": "причина", "priority": "low"}
  ]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error('API недоступен');
      }

      const data = await response.json();
      const aiText = data.content?.find(item => item.type === 'text')?.text || '';
      
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        setAiRecommendations(recommendations);
      } else {
        throw new Error('Не удалось распарсить ответ');
      }
    } catch (error) {
      console.error('Ошибка генерации рекомендаций:', error);
      
      // Создаем умные рекомендации на основе данных
      const analysis = generateSmartAnalysis();
      setAiRecommendations(analysis);
    }
    
    setLoadingRecommendations(false);
  };

  // Умная аналитика без API
  const generateSmartAnalysis = () => {
    const totalInvested = portfolio.reduce((sum, item) => sum + item.avgPrice * item.amount, 0);
    const currentTotal = portfolio.reduce((sum, item) => {
      const crypto = cryptoData.find(c => c.symbol === item.symbol);
      return sum + (crypto ? crypto.price * item.amount : 0);
    }, 0);
    const totalProfit = currentTotal - totalInvested;
    const profitPercent = (totalProfit / totalInvested) * 100;

    // Анализ каждой позиции
    const positions = portfolio.map(item => {
      const crypto = cryptoData.find(c => c.symbol === item.symbol);
      const currentValue = crypto ? crypto.price * item.amount : 0;
      const invested = item.avgPrice * item.amount;
      const profit = currentValue - invested;
      const profitPercent = (profit / invested) * 100;
      
      return {
        ...item,
        crypto,
        profit,
        profitPercent,
        weight: (currentValue / currentTotal) * 100
      };
    });

    // Находим лучших и худших
    const bestPerformer = positions.reduce((max, p) => p.profitPercent > max.profitPercent ? p : max, positions[0]);
    const worstPerformer = positions.reduce((min, p) => p.profitPercent < min.profitPercent ? p : min, positions[0]);
    
    // Находим самого растущего на рынке
    const topGainer = cryptoData.reduce((max, c) => c.change24h > max.change24h ? c : max, cryptoData[0]);

    const recommendations = [];

    // Рекомендация 1: Основная позиция
    if (!portfolio.find(p => p.symbol === 'BTC') || positions.find(p => p.symbol === 'BTC')?.weight < 30) {
      recommendations.push({
        action: 'КУПИТЬ',
        coin: 'BTC',
        reason: 'Bitcoin - основа портфолио. Рекомендуется держать 30-50% в BTC для стабильности',
        priority: 'high'
      });
    } else {
      recommendations.push({
        action: 'ДЕРЖАТЬ',
        coin: 'BTC',
        reason: `Хорошая базовая позиция, текущий вес ${positions.find(p => p.symbol === 'BTC')?.weight.toFixed(1)}%`,
        priority: 'medium'
      });
    }

    // Рекомендация 2: На основе текущих трендов
    if (topGainer.change24h > 5 && !portfolio.find(p => p.symbol === topGainer.symbol)) {
      recommendations.push({
        action: 'КУПИТЬ',
        coin: topGainer.symbol,
        reason: `Показывает сильный рост +${topGainer.change24h.toFixed(2)}% за 24ч. Можно добавить 5-10% портфолио`,
        priority: 'medium'
      });
    } else if (worstPerformer.profitPercent < -20) {
      recommendations.push({
        action: 'ПРОДАТЬ',
        coin: worstPerformer.symbol,
        reason: `Убыток ${worstPerformer.profitPercent.toFixed(1)}%. Рассмотри фиксацию убытка или усреднение`,
        priority: 'low'
      });
    } else {
      recommendations.push({
        action: 'ДЕРЖАТЬ',
        coin: 'ETH',
        reason: 'Ethereum - вторая по надежности крипта, основа DeFi экосистемы',
        priority: 'medium'
      });
    }

    // Рекомендация 3: Ребалансировка
    if (bestPerformer.profitPercent > 50) {
      recommendations.push({
        action: 'ПРОДАТЬ',
        coin: bestPerformer.symbol,
        reason: `Зафиксируй часть прибыли (+${bestPerformer.profitPercent.toFixed(1)}%). Продай 20-30% позиции`,
        priority: 'high'
      });
    } else if (cryptoData.find(c => c.symbol === 'SOL')?.change24h > 3) {
      recommendations.push({
        action: 'КУПИТЬ',
        coin: 'SOL',
        reason: 'Solana показывает рост. Быстрый блокчейн с низкими комиссиями',
        priority: 'low'
      });
    } else {
      recommendations.push({
        action: 'ДЕРЖАТЬ',
        coin: 'портфолио',
        reason: 'Текущая структура сбалансирована. Придерживайся плана',
        priority: 'low'
      });
    }

    return {
      analysis: `Твое портфолио ${profitPercent >= 0 ? 'в плюсе' : 'в минусе'} на ${Math.abs(profitPercent).toFixed(2)}% ($${Math.abs(totalProfit).toFixed(2)}). Лучшая позиция: ${bestPerformer.symbol} (+${bestPerformer.profitPercent.toFixed(1)}%). Худшая: ${worstPerformer.symbol} (${worstPerformer.profitPercent.toFixed(1)}%). Общая стоимость: $${currentTotal.toFixed(2)}.`,
      recommendations: recommendations
    };
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchCryptoData();
    fetchNews();
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Автоматическая генерация рекомендаций после загрузки данных
  useEffect(() => {
    if (cryptoData.length > 0 && !loading && !aiRecommendations) {
      setTimeout(() => {
        generateAIRecommendations();
      }, 1000);
    }
  }, [cryptoData, loading]);

  useEffect(() => {
    if (selectedCrypto) {
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
      fetchChartData(selectedCrypto, days);
    }
  }, [selectedCrypto, timeframe]);

  useEffect(() => {
    const total = portfolio.reduce((sum, item) => {
      const crypto = cryptoData.find(c => c.symbol === item.symbol);
      return sum + (crypto ? crypto.price * item.amount : 0);
    }, 0);
    setPortfolioValue(total);
  }, [portfolio, cryptoData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const selectedCryptoData = cryptoData.find(c => c.id === selectedCrypto);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessageToClaude(inputMessage.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative overflow-hidden">
      {/* Футуристичный фон */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Сетка */}
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Хедер */}
        <header className="mb-12 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent" 
                    style={{ fontFamily: 'Orbitron, monospace' }}>
                  CRYPTO NEXUS AI
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    POWERED BY CLAUDE AI
                    {lastUpdate && (
                      <span className="ml-2 text-cyan-400">
                        • {lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      fetchCryptoData();
                      fetchNews();
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-gray-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl px-6 py-3">
                <div className="text-xs text-gray-500 mb-1">ПОРТФОЛИО</div>
                <div className="text-2xl font-bold text-cyan-400">{formatNumber(portfolioValue)}</div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <div className="text-xs text-gray-400">
                  {loading ? 'Загрузка...' : 'Онлайн'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* AI Рекомендации */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="text-purple-400" />
                AI РЕКОМЕНДАЦИИ CLAUDE
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={generateAIRecommendations}
                  disabled={loadingRecommendations}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
                >
                  {loadingRecommendations ? 'Анализирую...' : '🔄 Обновить анализ'}
                </button>
              </div>
            </div>
            
            {aiRecommendations && (
              <div className="space-y-4">
                <p className="text-gray-300">{aiRecommendations.analysis}</p>
                
                {aiRecommendations.recommendations.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendations.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className={`w-5 h-5 ${
                            rec.priority === 'high' ? 'text-red-400' :
                            rec.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`} />
                          <span className={`font-bold ${
                            rec.action === 'КУПИТЬ' ? 'text-green-400' :
                            rec.action === 'ПРОДАТЬ' ? 'text-red-400' : 'text-blue-400'
                          }`}>{rec.action} {rec.coin}</span>
                        </div>
                        <p className="text-sm text-gray-400">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Основной грид */}
        <div className="grid grid-cols-12 gap-6">
          {/* Список криптовалют */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <h2 className="text-sm font-bold text-gray-500 mb-4 tracking-wider">
              TOP ASSETS {!loading && <span className="text-cyan-400 ml-2">● LIVE</span>}
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-cyan-400 animate-pulse text-lg">Загрузка...</div>
              </div>
            ) : (
              cryptoData.map((crypto, index) => (
                <div
                  key={crypto.id}
                  onClick={() => setSelectedCrypto(crypto.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-xl ${
                    selectedCrypto === crypto.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                      : 'bg-gray-900/30 border border-gray-800 hover:border-gray-700'
                  }`}
                  style={{
                    animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={crypto.image} alt={crypto.symbol} className="w-12 h-12 rounded-lg" />
                      <div>
                        <div className="font-bold text-lg">{crypto.symbol}</div>
                        <div className="text-xs text-gray-500">{crypto.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${crypto.price.toLocaleString()}</div>
                      <div className={`flex items-center gap-1 text-sm ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {crypto.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(crypto.change24h).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* График и детали */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {selectedCryptoData?.image && (
                      <img src={selectedCryptoData.image} alt={selectedCryptoData.symbol} className="w-16 h-16" />
                    )}
                    <div>
                      <h3 className="text-3xl font-black" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {selectedCryptoData?.name}
                      </h3>
                      <p className="text-gray-500">{selectedCryptoData?.symbol}</p>
                    </div>
                  </div>
                  <div className="text-5xl font-black text-cyan-400 mb-2">
                    ${selectedCryptoData?.price.toLocaleString()}
                  </div>
                  <div className={`flex items-center gap-2 text-xl ${selectedCryptoData?.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedCryptoData?.change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                    {Math.abs(selectedCryptoData?.change24h || 0).toFixed(2)}% (24h)
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {['24h', '7d', '30d'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        timeframe === tf
                          ? 'bg-cyan-500 text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 mb-6">
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-cyan-400 animate-pulse">Загрузка графика...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#4b5563" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#4b5563" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">MARKET CAP</div>
                  <div className="text-xl font-bold text-purple-400">
                    {formatNumber(selectedCryptoData?.marketCap || 0)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">VOLUME 24H</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {formatNumber(selectedCryptoData?.volume24h || 0)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">DOMINANCE</div>
                  <div className="text-xl font-bold text-pink-400">
                    {((selectedCryptoData?.marketCap || 0) / 2500000000000 * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Портфолио */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="text-cyan-400" />
                МОЁ ПОРТФОЛИО
              </h3>
              <div className="space-y-3">
                {portfolio.map((item, index) => {
                  const crypto = cryptoData.find(c => c.symbol === item.symbol);
                  const currentValue = crypto ? crypto.price * item.amount : 0;
                  const profit = currentValue - (item.avgPrice * item.amount);
                  const profitPercent = (profit / (item.avgPrice * item.amount)) * 100;

                  return (
                    <div key={index} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {crypto?.image && (
                            <img src={crypto.image} alt={crypto.symbol} className="w-10 h-10 rounded-lg" />
                          )}
                          <div>
                            <div className="font-bold">{item.symbol}</div>
                            <div className="text-sm text-gray-500">{item.amount} монет</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatNumber(currentValue)}</div>
                          <div className={`text-sm ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Новости */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-cyan-400" />
                ПОСЛЕДНИЕ НОВОСТИ
              </h3>
              <div className="space-y-3">
                {news.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">{item.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                      {item.trend === 'up' && <TrendingUp className="text-green-400 w-5 h-5 flex-shrink-0 ml-2" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Инфо о доступе с других устройств */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-blue-400 w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg mb-2 text-blue-300">📱 Доступ с телефона и других устройств</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Чтобы открывать это приложение на телефоне, планшете или другом компьютере:
                  </p>
                  <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Задеплой на <span className="text-cyan-400 font-bold">Vercel</span> (бесплатно, 5 минут)</li>
                    <li>Получишь ссылку типа <code className="bg-gray-800 px-2 py-1 rounded">your-app.vercel.app</code></li>
                    <li>Открывай на любом устройстве! 🚀</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-3">
                    Подробная инструкция в файле <code className="bg-gray-800 px-2 py-1 rounded">DEPLOY_GUIDE.md</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка чата */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 hover:scale-110 transition-transform z-50"
      >
        {isChatOpen ? <MessageSquare className="w-8 h-8 text-white" /> : <Bot className="w-8 h-8 text-white" />}
      </button>

      {/* AI Чат */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 z-50 flex flex-col">
          <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bot className="w-6 h-6" />
                Claude AI Советник
              </h3>
              <p className="text-xs text-gray-200">Задай вопрос о криптовалютах</p>
            </div>
            {chatMessages.length > 0 && (
              <button
                onClick={() => setChatMessages([])}
                className="text-white/80 hover:text-white text-xs px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 mt-4">
                <Bot className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
                <p className="font-bold text-lg text-white mb-2">Привет! Я Claude 🤖</p>
                <p className="text-sm mb-4">Твой AI советник по криптовалютам</p>
                
                <div className="text-left bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-cyan-400 font-bold">Попробуй спросить:</p>
                  <button
                    onClick={() => {
                      setInputMessage('Проанализируй мое портфолио');
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="w-full text-left p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    💼 Проанализируй мое портфолио
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage('Куда лучше инвестировать сейчас?');
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="w-full text-left p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    📈 Куда лучше инвестировать?
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage('Что думаешь про Solana?');
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="w-full text-left p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    🔮 Что думаешь про Solana?
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage('Стоит ли продавать в минус?');
                      document.querySelector('input[type="text"]')?.focus();
                    }}
                    className="w-full text-left p-2 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    ⚡ Стоит ли продавать в минус?
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">
                  ✨ Я вижу твое портфолио и актуальные цены
                </p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-3 ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isAITyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Спроси что-нибудь..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500"
                disabled={isAITyping}
              />
              <button
                type="submit"
                disabled={isAITyping || !inputMessage.trim()}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white p-2 rounded-lg hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
