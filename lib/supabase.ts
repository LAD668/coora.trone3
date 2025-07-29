export const addPostReaction = async (postId: string, userId: string, emoji: string) => {
  const { data, error } = await supabase
    .from('post_reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      emoji: emoji,
    }, {
      onConflict: 'post_id,user_id,emoji'
    })
    .select()
    .single();

  if (error) throw error;
   
   if (!data) {
     throw new Error('Failed to add reaction');
   }
   
  return data;
};

export const removePostReaction = async (postId: string, userId: string, emoji: string) => {
  const { error } = await supabase
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
};