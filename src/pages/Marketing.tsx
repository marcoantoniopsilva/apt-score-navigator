import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Brain, Scale, FileText, Puzzle, MapPin, DollarSign, CheckCircle, Paperclip, Bot, BarChart3, ArrowRight, Instagram, Mail, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import personChoosingProperty from '@/assets/person-choosing-property.jpg';
import propertyDecisionHero from '@/assets/property-decision-hero.jpg';
import beforeAfterComparison from '@/assets/before-after-comparison.jpg';
const Marketing = () => {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/');
  };
  const handleLogin = () => {
    navigate('/auth');
  };
  const howItWorksSteps = [{
    icon: CheckCircle,
    number: "1",
    title: "Personalize seus critérios",
    description: "Escolha o que é mais importante para você: localização, preço, segurança, tamanho, entre outros."
  }, {
    icon: Paperclip,
    number: "2",
    title: "Envie os links dos imóveis",
    description: "Cole os links dos anúncios que te interessam (Zap, OLX, QuintoAndar, Loft e outros)."
  }, {
    icon: Bot,
    number: "3",
    title: "O Imobly analisa tudo automaticamente",
    description: "Nos bastidores, nosso sistema extrai as informações, avalia cada imóvel e gera uma nota final personalizada."
  }, {
    icon: BarChart3,
    number: "4",
    title: "Compare com inteligência",
    description: "Visualize os imóveis lado a lado, com os prós e contras e as notas finais. Fica fácil decidir."
  }];
  const benefits = [{
    icon: Brain,
    title: "Comparador com inteligência artificial",
    description: "IA avançada para análise completa de imóveis"
  }, {
    icon: Scale,
    title: "Notas automáticas por critério de perfil",
    description: "Pontuação personalizada baseada nas suas preferências"
  }, {
    icon: FileText,
    title: "Interface leve e fácil de usar",
    description: "Design intuitivo que facilita sua decisão"
  }, {
    icon: Puzzle,
    title: "Filtros personalizados e editáveis",
    description: "Adapte os critérios conforme suas necessidades"
  }, {
    icon: MapPin,
    title: "Análise de localização: segurança, mobilidade, parques",
    description: "Avaliação completa do entorno do imóvel"
  }, {
    icon: DollarSign,
    title: "Cálculo automático do custo total",
    description: "Aluguel + taxas calculados automaticamente"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/8b287073-0305-4a43-9583-d58912b9e6f4.png" alt="Imobly Logo" className="w-8 h-8" />
            <div className="text-xl font-bold text-white">
              Imobly
            </div>
          </div>
          <Button variant="outline" onClick={handleLogin} className="border-white hover:bg-white transition-colors flex items-center gap-2 text-blue-900">
            <LogIn className="w-4 h-4" />
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8
          }}>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Encontre o imóvel ideal. <span className="text-blue-200">Sem perder tempo.</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                O Imobly analisa e compara imóveis automaticamente, com base no que realmente importa para você. Simples, inteligente e gratuito.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleGetStarted} className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-4 text-lg">
                  Começar agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleGetStarted} className="border-white hover:bg-white transition-colors px-8 py-4 text-lg text-sky-900">
                  Ver como funciona
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="relative">
              <img src={propertyDecisionHero} alt="Pessoa em dúvida sobre qual imóvel escolher" className="w-full rounded-2xl shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-blue-900 mb-6">
              Como o Imobly te ajuda a decidir melhor
            </h2>
            <img src={personChoosingProperty} alt="Processo de decisão inteligente" className="w-full max-w-2xl mx-auto rounded-xl shadow-lg mb-8" />
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="h-full border-blue-100 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-3">{step.number}</div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-blue-900 mb-6">
              Mais do que uma busca. <span className="text-blue-600">Uma análise inteligente.</span>
            </h2>
            <img src={beforeAfterComparison} alt="Antes e depois com Imobly" className="w-full max-w-3xl mx-auto rounded-xl shadow-lg" />
          </motion.div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }}>
                <Card className="h-full border-blue-200 hover:border-blue-400 transition-colors bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Seu tempo vale muito. <span className="text-blue-200">E seu novo lar também.</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Use o Imobly e decida com base em dados, não em achismos.
              Gratuito, rápido e feito para facilitar a escolha do seu imóvel ideal.
            </p>
            <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
              <Button size="lg" onClick={handleGetStarted} className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-12 py-6 text-xl shadow-2xl">
                Começar agora gratuitamente
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/lovable-uploads/8b287073-0305-4a43-9583-d58912b9e6f4.png" alt="Imobly Logo" className="w-8 h-8" />
                  <div className="text-xl font-bold text-white">
                    Imobly
                  </div>
                </div>
                <p className="text-blue-200 leading-relaxed max-w-md">
                  Criado para ajudar pessoas a decidirem melhor onde morar, com inteligência e praticidade.
                  Transformamos links em insights.
                </p>
              </div>
              
              <div className="flex flex-col gap-4">
                <h4 className="text-white font-semibold">Links úteis</h4>
                <div className="flex flex-col gap-2">
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Sobre</a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contato
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors flex items-center gap-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">Termos de uso</a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-blue-800 pt-6 text-center">
              <p className="text-blue-300">© 2025 Imobly</p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Marketing;