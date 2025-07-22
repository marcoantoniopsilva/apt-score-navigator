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

  static async buscarLocalidades(termo: string): Promise<Array<{nome: string, tipo: 'estado' | 'municipio', uf?: string}>> {
    try {
      // Busca nos estados
      const estados = await this.getEstados();
      const estadosEncontrados = estados
        .filter(estado => 
          estado.nome.toLowerCase().includes(termo.toLowerCase()) ||
          estado.sigla.toLowerCase().includes(termo.toLowerCase())
        )
        .map(estado => ({
          nome: estado.nome,
          tipo: 'estado' as const
        }));

      // Se o termo tem mais de 2 caracteres, busca também nos municípios mais populosos
      const municipiosEncontrados: Array<{nome: string, tipo: 'municipio', uf: string}> = [];
      
      if (termo.length > 2) {
        // Lista dos estados mais populosos para buscar municípios
        const estadosPopulosos = ['SP', 'RJ', 'MG', 'RS', 'PR', 'BA', 'SC', 'GO', 'PE'];
        
        for (const uf of estadosPopulosos.slice(0, 3)) { // Limita a 3 estados para não sobrecarregar
          try {
            const municipios = await this.getMunicipiosPorEstado(uf);
            const municipiosFiltrados = municipios
              .filter(municipio => 
                municipio.nome.toLowerCase().includes(termo.toLowerCase())
              )
              .slice(0, 5) // Limita a 5 municípios por estado
              .map(municipio => ({
                nome: municipio.nome,
                tipo: 'municipio' as const,
                uf
              }));
            
            municipiosEncontrados.push(...municipiosFiltrados);
          } catch (error) {
            // Continua mesmo se falhar em um estado
            console.warn(`Erro ao buscar municípios em ${uf}:`, error);
          }
        }
      }

      return [...estadosEncontrados, ...municipiosEncontrados].slice(0, 10);
    } catch (error) {
      console.error('Erro ao buscar localidades:', error);
      return [];
    }
  }
}