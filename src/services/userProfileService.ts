import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserCriteriaPreference, UserProfileType } from '@/types/onboarding';

export class UserProfileService {
  static async saveUserProfile(
    userId: string,
    profileType: UserProfileType,
    objetivoPrincipal: string,
    situacaoMoradia: string,
    valorPrincipal: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Primeiro verifica se já existe um perfil para este usuário
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Atualiza o perfil existente
        const { error } = await supabase
          .from('user_profiles')
          .update({
            profile_type: profileType,
            objetivo_principal: objetivoPrincipal,
            situacao_moradia: situacaoMoradia,
            valor_principal: valorPrincipal
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Cria um novo perfil
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            profile_type: profileType,
            objetivo_principal: objetivoPrincipal,
            situacao_moradia: situacaoMoradia,
            valor_principal: valorPrincipal
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar perfil' 
      };
    }
  }

  static async saveUserCriteriaPreferences(
    userId: string,
    criteriaWeights: Record<string, number>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove preferências antigas do usuário
      await supabase
        .from('user_criteria_preferences')
        .delete()
        .eq('user_id', userId);

      // Insere as novas preferências
      const preferences: Omit<UserCriteriaPreference, 'id' | 'created_at' | 'updated_at'>[] = 
        Object.entries(criteriaWeights).map(([criterioNome, peso]) => ({
          user_id: userId,
          criterio_nome: criterioNome,
          peso,
          ativo: true
        }));

      const { error } = await supabase
        .from('user_criteria_preferences')
        .insert(preferences);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error saving user criteria preferences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao salvar preferências' 
      };
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async getUserCriteriaPreferences(userId: string): Promise<UserCriteriaPreference[]> {
    try {
      const { data, error } = await supabase
        .from('user_criteria_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true)
        .order('peso', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user criteria preferences:', error);
      return [];
    }
  }

  static async hasUserCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      const preferences = await this.getUserCriteriaPreferences(userId);
      
      return !!(profile && preferences.length > 0);
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  static async deleteUserProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove preferências
      await supabase
        .from('user_criteria_preferences')
        .delete()
        .eq('user_id', userId);

      // Remove perfil
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao deletar perfil' 
      };
    }
  }
}