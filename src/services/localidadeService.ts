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
  static async buscarLocalidades(termo: string): Promise<Array<{nome: string, tipo: 'estado' | 'municipio' | 'bairro', uf?: string}>> {
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

  // Lista de bairros conhecidos das principais cidades
  private static getBairrosConhecidos(termo: string): Array<{nome: string, tipo: 'bairro', uf: string}> {
    const bairrosSP = [
      'Vila Madalena', 'Pinheiros', 'Jardins', 'Moema', 'Itaim Bibi', 'Vila Olimpia',
      'Perdizes', 'Higienópolis', 'Liberdade', 'Bela Vista', 'Consolação', 'Santa Cecília',
      'Campo Belo', 'Vila Nova Conceição', 'Brooklin', 'Morumbi', 'Vila Mariana',
      'Ipiranga', 'Tatuapé', 'Santana', 'Vila Guilherme', 'Penha', 'Vila Prudente',
      'Sacomã', 'Jabaquara', 'Ibirapuera', 'Vila Clementino', 'Aclimação', 'Barra Funda',
      'Lapa', 'Alto de Pinheiros', 'Butantã', 'Vila Leopoldina', 'Jaguaré', 'Rio Pequeno'
    ];

    const bairrosRJ = [
      'Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Urca', 'Lagoa',
      'Gávea', 'São Conrado', 'Tijuca', 'Vila Isabel', 'Grajaú', 'Maracanã',
      'Centro', 'Santa Teresa', 'Lapa', 'Gloria', 'Catete', 'Laranjeiras',
      'Humaitá', 'Jardim Botânico', 'Cosme Velho', 'Barra da Tijuca', 'Recreio',
      'Jacarepaguá', 'Méier', 'Todos os Santos', 'Engenho Novo', 'Abolição'
    ];

    const bairrosBH = [
      'Savassi', 'Funcionários', 'Centro', 'Lourdes', 'Santo Agostinho', 'Carmo',
      'Serra', 'Mangabeiras', 'Belvedere', 'Buritis', 'Estoril', 'Gutierrez',
      'Santa Efigênia', 'São Pedro', 'Floresta', 'Lagoinha', 'Carlos Prates',
      'Coração Eucarístico', 'São Lucas', 'Castelo', 'Prado', 'Santa Amélia'
    ];

    const todosBairros = [
      ...bairrosSP.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'SP'})),
      ...bairrosRJ.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'RJ'})),
      ...bairrosBH.map(b => ({nome: b, tipo: 'bairro' as const, uf: 'MG'}))
    ];

    return todosBairros
      .filter(bairro => 
        bairro.nome.toLowerCase().includes(termo.toLowerCase())
      )
      .slice(0, 6);
  }
}