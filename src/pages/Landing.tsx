import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Rocket, Target, BarChart3, Settings, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apartmentJourneyImage from '@/assets/apartment-choice-journey.jpg';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  const features = [
    {
      icon: Target,
      title: "Adicionar Propriedades",
      description: "Clique em \"Adicionar Propriedade\" para inserir manualmente ou cole a URL de um anúncio para extração automática dos dados."
    },
    {
      icon: BarChart3,
      title: "Sistema de Pontuação",
      description: "Cada propriedade é avaliada em 5 a 10 critérios, conforme você define em suas preferências, numa escala de 1 a 10."
    },
    {
      icon: Settings,
      title: "Pesos dos Critérios",
      description: "Ajuste a importância de cada critério, conforme suas preferências. Critérios com peso maior influenciam mais a pontuação final."
    },
    {
      icon: CheckCircle,
      title: "Ranking Automático",
      description: "As propriedades são automaticamente ordenadas pela pontuação final, calculada com base nas notas e pesos definidos."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Encontre o <span className="text-primary">Apartamento Perfeito</span> para Você
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Compare imóveis de forma inteligente com critérios personalizados e descubra qual se encaixa melhor no seu perfil.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <img 
              src={apartmentJourneyImage} 
              alt="Jornada de escolha do apartamento ideal"
              className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-foreground mb-4">
            Como Funciona o Comparador de Imóveis
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Um sistema inteligente que analisa suas preferências e ajuda você a tomar a melhor decisão.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="border-primary/20 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                Pronto para Encontrar seu Lar Ideal?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Comece agora e deixe nossa IA ajudar você a tomar a melhor decisão na escolha do seu próximo apartamento.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Começar Agora
                </Button>
              </motion.div>
              
              <p className="text-sm text-muted-foreground mt-4">
                Gratuito para começar • Sem cartão de crédito necessário
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Landing;