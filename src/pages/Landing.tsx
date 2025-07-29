import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Rocket, Target, BarChart3, Settings, CheckCircle, LogIn, Play, Users, Brain, MapPin, Calculator, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const howItWorksSteps = [
    {
      icon: Users,
      number: "1",
      title: "Personalize seus critérios",
      description: "Escolha o que é mais importante para você: localização, preço, segurança, tamanho, entre outros."
    },
    {
      icon: Target,
      number: "2", 
      title: "Envie os links dos imóveis",
      description: "Cole os links dos anúncios que te interessam (Zap, OLX, QuintoAndar, Loft e outros)."
    },
    {
      icon: Brain,
      number: "3",
      title: "O Imobly analisa tudo automaticamente",
      description: "Nos bastidores, nosso sistema extrai as informações, avalia cada imóvel e gera uma nota final personalizada."
    },
    {
      icon: BarChart3,
      number: "4",
      title: "Compare com inteligência",
      description: "Visualize os imóveis lado a lado, com os prós e contras e as notas finais. Fica fácil decidir."
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: "Comparador com inteligência artificial",
      description: "Análise automatizada e inteligente dos imóveis"
    },
    {
      icon: BarChart3,
      title: "Notas automáticas por critério de perfil",
      description: "Pontuação personalizada baseada nas suas preferências"
    },
    {
      icon: Settings,
      title: "Interface leve e fácil de usar",
      description: "Design intuitivo e experiência simplificada"
    },
    {
      icon: Filter,
      title: "Filtros personalizados e editáveis",
      description: "Customize os critérios conforme suas necessidades"
    },
    {
      icon: MapPin,
      title: "Análise de localização completa",
      description: "Segurança, mobilidade, parques e infraestrutura"
    },
    {
      icon: Calculator,
      title: "Cálculo automático do custo total",
      description: "Aluguel + taxas + custos adicionais em um só lugar"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/48347394-e148-481e-9b02-b7c9a685cb16.png" 
                alt="Imobly Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-blue-900">Imobly</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogin}
              className="flex items-center gap-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Encontre o imóvel ideal. <br />
                <span className="text-blue-200">Sem perder tempo.</span>
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                O Imobly analisa e compara imóveis automaticamente, com base no que realmente importa para você. Simples, inteligente e gratuito.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="text-lg px-8 py-6 bg-white text-blue-900 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Começar agora
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-6 border-white text-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Ver como funciona
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-blue-900 mb-4">
              Como o Imobly te ajuda a decidir melhor
            </h2>
            <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
              Um processo simples e inteligente em 4 etapas
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorksSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-blue-900 mb-4">
              Mais do que uma busca. Uma análise inteligente.
            </h2>
            <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
              Recursos exclusivos que fazem a diferença na sua decisão
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <Card className="h-full border-blue-100 hover:border-blue-300 transition-colors hover:shadow-lg">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <benefit.icon className="w-6 h-6 text-blue-900" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Seu tempo vale muito. <br />
              <span className="text-blue-200">E seu novo lar também.</span>
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Use o Imobly e decida com base em dados, não em achismos.
              Gratuito, rápido e feito para facilitar a escolha do seu imóvel ideal.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="text-xl px-12 py-8 bg-white text-blue-900 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Rocket className="w-6 h-6 mr-3" />
                Começar agora gratuitamente
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="/lovable-uploads/48347394-e148-481e-9b02-b7c9a685cb16.png" 
                    alt="Imobly Logo" 
                    className="h-8 w-8"
                  />
                  <span className="text-xl font-bold">Imobly</span>
                </div>
                <p className="text-blue-200 max-w-md leading-relaxed">
                  Criado para ajudar pessoas a decidirem melhor onde morar, com inteligência e praticidade. 
                  Transformamos links em insights.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex gap-4 text-sm">
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Sobre</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Contato</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Instagram</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Termos de uso</a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-300 text-sm">
              © 2025 Imobly. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;