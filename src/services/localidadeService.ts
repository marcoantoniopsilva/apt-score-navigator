interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

interface Municipio {
  nome: string;
  codigo_ibge: string;
}

export interface LocalidadeSugestao {
  nome: string;
  tipo: 'estado' | 'municipio' | 'bairro';
  uf?: string;
  cidade?: string;
}

export class LocalidadeService {
  private static BASE_URL = 'https://brasilapi.com.br/api';

  static async getEstados(): Promise<Estado[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/ibge/uf/v1`);
      if (!response.ok) throw new Error('Erro ao buscar estados');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar estados:', error);
      return [];
    }
  }

  static async getMunicipiosPorEstado(uf: string): Promise<Municipio[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`);
      if (!response.ok) throw new Error('Erro ao buscar municípios');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return [];
    }
  }

  // Busca localidades includindo bairros conhecidos
  static async buscarLocalidades(termo: string): Promise<Array<{nome: string, tipo: 'estado' | 'municipio' | 'bairro', uf?: string, cidade?: string}>> {
    try {
      const resultados = [];

      // Busca nos estados
      const estados = await this.getEstados();
      const estadosEncontrados = estados
        .filter(estado => 
          estado.nome.toLowerCase().includes(termo.toLowerCase()) ||
          estado.sigla.toLowerCase().includes(termo.toLowerCase())
        )
        .slice(0, 3) // Limita estados
        .map(estado => ({
          nome: estado.nome,
          tipo: 'estado' as const
        }));

      resultados.push(...estadosEncontrados);

      // Busca nos municípios dos estados mais populosos
      if (termo.length > 1) {
        const estadosPopulosos = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'GO', 'PE', 'CE', 'DF'];
        
        for (const uf of estadosPopulosos.slice(0, 4)) {
          try {
            const municipios = await this.getMunicipiosPorEstado(uf);
            const municipiosFiltrados = municipios
              .filter(municipio => 
                municipio.nome.toLowerCase().includes(termo.toLowerCase())
              )
              .slice(0, 3)
              .map(municipio => ({
                nome: municipio.nome,
                tipo: 'municipio' as const,
                uf
              }));
            
            resultados.push(...municipiosFiltrados);
          } catch (error) {
            console.warn(`Erro ao buscar municípios em ${uf}:`, error);
          }
        }
      }

      // Adiciona bairros conhecidos das principais cidades
      const bairrosConhecidos = this.getBairrosConhecidos(termo);
      resultados.push(...bairrosConhecidos);

      return resultados.slice(0, 12);
    } catch (error) {
      console.error('Erro ao buscar localidades:', error);
      return [];
    }
  }

  // Lista expandida de bairros conhecidos das principais cidades
  private static getBairrosConhecidos(termo: string): Array<{nome: string, tipo: 'bairro', uf: string, cidade?: string}> {
    const bairrosSP = [
      'Vila Madalena', 'Pinheiros', 'Jardins', 'Moema', 'Itaim Bibi', 'Vila Olimpia',
      'Perdizes', 'Higienópolis', 'Liberdade', 'Bela Vista', 'Consolação', 'Santa Cecília',
      'Campo Belo', 'Vila Nova Conceição', 'Brooklin', 'Morumbi', 'Vila Mariana',
      'Ipiranga', 'Tatuapé', 'Santana', 'Vila Guilherme', 'Penha', 'Vila Prudente',
      'Sacomã', 'Jabaquara', 'Ibirapuera', 'Vila Clementino', 'Aclimação', 'Barra Funda',
      'Lapa', 'Alto de Pinheiros', 'Butantã', 'Vila Leopoldina', 'Jaguaré', 'Rio Pequeno',
      'Cerqueira César', 'Paraíso', 'Vila São Francisco', 'Chácara Klabin', 'Mirandópolis',
      'Saúde', 'Vila Monumento', 'Cursino', 'Vila da Saúde', 'Planalto Paulista',
      'Chácara Flora', 'Brooklin Novo', 'Granja Julieta', 'Socorro', 'Cidade Ademar',
      'Vila Andrade', 'Santo Amaro', 'Campo Grande', 'Cidade Dutra', 'Capão Redondo',
      'Jardim São Luís', 'Jardim Ângela', 'Cidade Tiradentes', 'Guaianases', 'Lajeado',
      'Itaquera', 'Cidade Líder', 'Vila Matilde', 'Sapopemba', 'São Mateus',
      'Iguatemi', 'Ermelino Matarazzo', 'Ponte Rasa', 'Cangaíba', 'Vila Esperança',
      'Penha de França', 'Artur Alvim', 'Cidade Patriarca', 'Vila Formosa', 'Água Rasa',
      'Belém', 'Brás', 'Pari', 'Canindé', 'Bom Retiro', 'Luz', 'República',
      'Sé', 'Cambuci', 'Vila Buarque', 'Avenida Paulista', 'Cerqueira César'
    ];

    const bairrosRJ = [
      'Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Urca', 'Lagoa',
      'Gávea', 'São Conrado', 'Tijuca', 'Vila Isabel', 'Grajaú', 'Maracanã',
      'Centro', 'Santa Teresa', 'Lapa', 'Gloria', 'Catete', 'Laranjeiras',
      'Humaitá', 'Jardim Botânico', 'Cosme Velho', 'Barra da Tijuca', 'Recreio',
      'Jacarepaguá', 'Méier', 'Todos os Santos', 'Engenho Novo', 'Abolição',
      'Vila da Penha', 'Penha', 'Penha Circular', 'Brás de Pina', 'Cordovil',
      'Parada de Lucas', 'Vigário Geral', 'Jardim América', 'Pavuna', 'Costa Barros',
      'Anchieta', 'Ricardo de Albuquerque', 'Guadalupe', 'Honório Gurgel', 'Rocha Miranda',
      'Turiaçu', 'Oswaldo Cruz', 'Bento Ribeiro', 'Madureira', 'Vaz Lobo',
      'Irajá', 'Colégio', 'Vicente de Carvalho', 'Vila da Penha', 'Olaria',
      'Ramos', 'Bonsucesso', 'Manguinhos', 'Benfica', 'São Cristóvão',
      'Caju', 'Gamboa', 'Santo Cristo', 'Saúde', 'Porto Maravilha'
    ];

    const bairrosBH = [
      // Região Centro-Sul (mais valorizados)
      'Savassi', 'Funcionários', 'Centro', 'Lourdes', 'Santo Agostinho', 'Carmo',
      'Serra', 'Mangabeiras', 'Belvedere', 'Buritis', 'Estoril', 'Gutierrez',
      'Santa Efigênia', 'São Pedro', 'Floresta', 'Lagoinha', 'Carlos Prates',
      'Coração Eucarístico', 'São Lucas', 'Castelo', 'Prado', 'Santa Amélia',
      
      // Região Sul
      'Vila Paris', 'Cruzeiro', 'Anchieta', 'Sion', 'Luxemburgo', 'Belvedere',
      'Mangabeiras', 'Vila da Serra', 'São Bento', 'Santa Lúcia', 'Cidade Jardim',
      'Santo Antônio', 'São José', 'Cidade Nova', 'Gameleira', 'Havaí',
      
      // Região Oeste
      'Buritis', 'Estoril', 'Betânia', 'Cabana do Pai Tomás', 'Jardim América',
      'Calafate', 'Vila Cloris', 'Prado Lopes', 'Caiçaras', 'Nova Suíça',
      'Jardim Canadá', 'São Paulo', 'Vila Oeste', 'Jardim Alvorada',
      
      // Região Norte
      'Lagoinha', 'Carlos Prates', 'Bonfim', 'Concórdia', 'Santa Efigênia',
      'Floresta', 'Cidade Nova', 'Boa Vista', 'Horto', 'São Paulo',
      'Pompéia', 'Jaraguá', 'Universitário', 'Cachoeirinha', 'Ribeiro de Abreu',
      
      // Região Leste
      'Santa Efigênia', 'Bom Jesus', 'Sagrada Família', 'Aparecida', 'Renascença',
      'Prado', 'Santa Rosa', 'São Geraldo', 'Leste', 'Granja de Freitas',
      'Heliópolis', 'Novo Glória', 'Glória', 'Santa Inês', 'Cinquentenário',
      
      // Região Nordeste
      'Concórdia', 'União', 'Sagrado Coração de Jesus', 'São Paulo',
      'Pompéia', 'Jardim Montanhês', 'Conjunto Felicidade', 'Gorduras',
      
      // Região Noroeste
      'Carlos Prates', 'Padre Eustáquio', 'Coração Eucarístico', 'São Paulo',
      'Jardim Montanhês', 'Caiçaras', 'Nova Cachoeirinha', 'Providência',
      
      // Região Pampulha
      'Pampulha', 'São Luiz', 'Liberdade', 'Bandeirantes', 'Ouro Preto',
      'Castelo', 'Dona Clara', 'São Francisco', 'Itapoã', 'Confisco',
      
      // Região Venda Nova
      'Venda Nova', 'Céu Azul', 'Jardim Leblon', 'Piratininga', 'Copacabana',
      'Santa Mônica', 'Jardim dos Comerciários', 'Nova York', 'Candelária',
      
      // Região Barreiro
      'Barreiro', 'Cardoso', 'Flávio Marques Lisboa', 'Lindéia', 'Mangueiras',
      'Olhos d\'Água', 'Araguaia', 'Bairro das Indústrias', 'Jatobá'
    ];

    // Outras cidades importantes
    const bairrosCuritiba = [
      'Centro', 'Batel', 'Água Verde', 'Bigorrilho', 'Bacacheri', 'Cabral',
      'Juvevê', 'Rebouças', 'Champagnat', 'Jardim Social', 'Mercês', 'São Francisco',
      'Cristo Rei', 'Jardim das Américas', 'Portão', 'Vila Izabel', 'Ahú',
      'Centro Cívico', 'Alto da Glória', 'Hugo Lange', 'Jardim Botânico'
    ];

    const bairrosPortoAlegre = [
      'Centro', 'Moinhos de Vento', 'Mont Serrat', 'Rio Branco', 'Cidade Baixa',
      'Bom Fim', 'Independência', 'Floresta', 'Menino Deus', 'Praia de Belas',
      'Santana', 'Farroupilha', 'Petrópolis', 'Higienópolis', 'Passo da Areia',
      'São Geraldo', 'Navegantes', 'Cristo Redentor', 'Jardim Lindóia'
    ];

    const bairrosSalvador = [
      'Pelourinho', 'Centro', 'Barra', 'Ondina', 'Rio Vermelho', 'Federação',
      'Graça', 'Vitória', 'Corredor da Vitória', 'Campo Grande', 'Canela',
      'Pituba', 'Itaigara', 'Caminho das Árvores', 'Iguatemi', 'Patamares',
      'Stella Maris', 'Flamengo', 'Alphaville', 'Paralela', 'Brotas'
    ];

    const bairrosBrasilia = [
      'Asa Norte', 'Asa Sul', 'Lago Norte', 'Lago Sul', 'Sudoeste', 'Noroeste',
      'Park Way', 'Cruzeiro', 'Octogonal', 'Candangolândia', 'Núcleo Bandeirante',
      'Riacho Fundo', 'Guará', 'Águas Claras', 'Vicente Pires', 'Taguatinga',
      'Ceilândia', 'Brazlândia', 'Sobradinho', 'Planaltina', 'Gama'
    ];

    const bairrosFortaleza = [
      'Centro', 'Meireles', 'Aldeota', 'Cocó', 'Varjota', 'Dionísio Torres',
      'Papicu', 'Praia de Iracema', 'Benfica', 'Montese', 'Fátima', 'Joaquim Távora',
      'Cidade dos Funcionários', 'Edson Queiroz', 'Água Fria', 'Parangaba',
      'Maraponga', 'Antônio Bezerra', 'Messejana', 'José de Alencar'
    ];

    const todosBairros = [
      ...bairrosSP.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'SP', cidade: 'São Paulo'})),
      ...bairrosRJ.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'RJ', cidade: 'Rio de Janeiro'})),
      ...bairrosBH.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'MG', cidade: 'Belo Horizonte'})),
      ...bairrosCuritiba.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'PR', cidade: 'Curitiba'})),
      ...bairrosPortoAlegre.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'RS', cidade: 'Porto Alegre'})),
      ...bairrosSalvador.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'BA', cidade: 'Salvador'})),
      ...bairrosBrasilia.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'DF', cidade: 'Brasília'})),
      ...bairrosFortaleza.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'CE', cidade: 'Fortaleza'}))
    ];

    return todosBairros
      .filter(bairro => 
        bairro.nome.toLowerCase().includes(termo.toLowerCase())
      )
      .slice(0, 6);
  }
}