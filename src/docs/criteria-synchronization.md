# Sincronização de Critérios - Documentação

## Visão Geral

O sistema de critérios foi refatorado para garantir sincronização automática entre todos os componentes da aplicação quando o usuário edita suas preferências através do onboarding.

## Arquitetura

### Context Provider
- **CriteriaProvider**: Context global que gerencia o estado dos critérios ativos
- **CriteriaContext**: Fornece acesso aos critérios e métodos de atualização
- Localizado em: `src/contexts/CriteriaContext.tsx`

### Hook de Compatibilidade
- **useCriteria**: Hook que re-exporta o context para manter compatibilidade
- Localizado em: `src/hooks/useCriteria.ts`

## Fluxo de Sincronização

1. **Edição de Preferências**:
   - Usuário clica em "Editar" no componente `UserPreferencesDisplay`
   - Modal de onboarding é aberto (`EnhancedOnboardingModal`)

2. **Salvamento**:
   - Dados são salvos via `useOnboarding.saveEnhancedOnboardingData()`
   - Evento `criteria-updated` é disparado globalmente

3. **Atualização Automática**:
   - `CriteriaContext` escuta o evento `criteria-updated`
   - Critérios são recalculados automaticamente
   - Todos os componentes conectados são atualizados

## Componentes Afetados

### Dashboard
- **PropertyList**: Recalcula pontuações das propriedades existentes
- **PropertyControls**: Atualiza editor de pesos
- **UserPreferencesDisplay**: Mostra novas preferências

### Formulários
- **AddPropertyForm**: Usa critérios atualizados para novas propriedades
- **PropertyScoresForm**: Campos de avaliação são atualizados dinamicamente

### Cálculos
- **scoreCalculator**: Recalcula todas as pontuações finais
- **PropertyCard**: Exibe novas pontuações

## Eventos Customizados

### `criteria-updated`
- **Disparado**: Após salvar alterações no onboarding
- **Escutado**: `CriteriaContext`, `Index.tsx`
- **Função**: Força recálculo de critérios e pontuações

## Benefícios

1. **Sincronização Automática**: Não há necessidade de recarregar a página
2. **Tempo Real**: Mudanças são refletidas imediatamente
3. **Consistência**: Todos os componentes usam os mesmos critérios
4. **Performance**: Recalcula apenas quando necessário

## Implementação Técnica

### Context Provider Setup
```tsx
// main.tsx
<CriteriaProvider>
  <App />
</CriteriaProvider>
```

### Event Dispatching
```tsx
// useOnboarding.ts
window.dispatchEvent(new CustomEvent('criteria-updated'));
```

### Event Listening
```tsx
// CriteriaContext.tsx
useEffect(() => {
  const handleCriteriaUpdate = () => {
    refreshCriteriaFromProfile();
  };
  window.addEventListener('criteria-updated', handleCriteriaUpdate);
  return () => window.removeEventListener('criteria-updated', handleCriteriaUpdate);
}, []);
```

## Compatibilidade

O sistema mantém total compatibilidade com o código existente através do hook `useCriteria`, que funciona como uma interface para o novo contexto.