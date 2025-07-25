import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import Header from '@/components/Header';
import { Plus, MoveHorizontal as MoreHorizontal, Heart, MessageCircle, Building2, Users, Smile } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamPosts, createPost, addPostReaction, removePostReaction } from '@/lib/supabase';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('InfoHub Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          retry={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfohubScreenContent() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'organization' | 'coach'>('organization');
  const [posts, setPosts] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostForModal, setSelectedPostForModal] = useState<any>(null);
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageUrl: '',
  });

  // Load posts from Supabase
  useEffect(() => {
    if (user?.teamId && user?.id) {
      console.log('Loading posts for user:', user.id, 'team:', user.teamId, 'tab:', activeTab);
      loadPosts();
    } else {
      console.log('User not ready for loading posts:', { userId: user?.id, teamId: user?.teamId });
      setIsLoading(false);
    }
  }, [activeTab, user]);

  const loadPosts = async () => {
    if (!user?.teamId || !user?.id) {
      console.log('Cannot load posts - missing user data:', { userId: user?.id, teamId: user?.teamId });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching posts for team:', user.teamId, 'type:', activeTab);
      const data = await getTeamPosts(user.teamId, activeTab);
      console.log('Received posts data:', data);
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
      // Don't show alert for loading errors, just log them
      console.error('Failed to load posts:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const canCreatePost = user?.role === 'trainer' || user?.role === 'admin';

  const handleCreatePost = async () => {
    if (!canCreatePost) {
      Alert.alert(t.error, 'You do not have permission to create posts');
      return;
    }

    if (!user?.teamId || !user?.id) {
      Alert.alert(t.error, 'User authentication error. Please try logging in again.');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    console.log('Creating post with user data:', {
      userId: user.id,
      teamId: user.teamId,
      userRole: user.role,
      postData: newPost,
      activeTab
    });
    try {

      const postData = {
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        postType: activeTab,
        teamId: user.teamId!,
        authorId: user.id,
      };
      
      console.log('Calling createPost with:', postData);
      const result = await createPost(postData);
      console.log('Post created successfully:', result);
      
      setNewPost({ title: '', content: '', imageUrl: '' });
      setModalVisible(false);
      Alert.alert(t.success, t.postCreated);
      loadPosts(); // Reload posts
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Full error details:', error);
      Alert.alert(t.error, `Failed to create post: ${errorMessage}`);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      const existingReaction = posts
        .find(p => p.id === postId)
        ?.post_reactions?.find((r: any) => r?.user_id === user.id && r?.emoji === emoji);

      if (existingReaction) {
        await removePostReaction(postId, user.id, emoji);
      } else {
        await addPostReaction(postId, user.id, emoji);
      }
      
      setShowEmojiPicker(null);
      loadPosts(); // Reload posts to get updated reactions
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const getReactionCount = (reactions: any[] = []) => {
    return Array.isArray(reactions) ? reactions.length : 0;
  };

  const getTopReactions = (reactions: any[] = []) => {
    if (!Array.isArray(reactions)) return [];
    
    const emojiCounts = reactions.reduce((acc, reaction) => {
      if (reaction?.emoji) {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      }
      return acc;
    }, {});
    
    return Object.entries(emojiCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3);
  };

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredPosts = Array.isArray(posts) ? posts.filter(post => post?.post_type === activeTab) : [];

  const handlePostClick = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPostForModal(post);
      setPostModalVisible(true);
    }
    setShowEmojiPicker(null);
  }

  // Check if user is properly loaded
  if (!user) {
    return (
      <View style={styles.container}>
        <Header title={t.infoHub} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t.infoHub} />
      
      <View style={styles.content}>
        {/* Toggle Section */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === 'organization' && styles.toggleButtonActive
              ]}
              onPress={() => setActiveTab('organization')}
            >
              <Building2 
                size={18} 
                color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
                strokeWidth={1.5} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === 'coach' && styles.toggleButtonActive
              ]}
              onPress={() => setActiveTab('coach')}
            >
              <Users 
                size={18} 
                color={activeTab === 'coach' ? '#1A1A1A' : '#8E8E93'} 
                strokeWidth={1.5} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {filteredPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                  {canCreatePost && (
                    <Text style={styles.emptyStateSubtext}>Create the first post for your team</Text>
                  )}
                </View>
              ) : (
                filteredPosts.map((post, index) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.postCard}
                onPress={() => handlePostClick(post.id)}
                activeOpacity={0.7}
              >
                <View style={styles.postHeader}>
                  <Text style={styles.postDate}>{formatDate(new Date(post.created_at))}</Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={[styles.postContent, styles.postContentTruncated]}>
                  {post.content}
                </Text>
                {post.content && post.content.length > 150 && (
                  <Text style={styles.readMoreText}>{t.tapToReadMore}</Text>
                )}

                {post.image_url && (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} />
                )}

                <View style={styles.postFooter}>
                  <View style={styles.reactions}>
                    {Array.isArray(post.post_reactions) && post.post_reactions.length > 0 ? (
                      <TouchableOpacity style={styles.reactionSummary}>
                        <View style={styles.reactionEmojis}>
                          {getTopReactions(post.post_reactions).map(([emoji]) => (
                            <Text key={emoji} style={styles.reactionEmoji}>{emoji}</Text>
                          ))}
                        </View>
                        <Text style={styles.reactionCount}>
                          <Text>{getReactionCount(post.post_reactions)}</Text>
                          <Text> {getReactionCount(post.post_reactions) === 1 ? t.reaction : t.reactions}</Text>
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                    >
                      <Smile size={16} color="#8E8E93" strokeWidth={1.5} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton}>
                      <MessageCircle size={16} color="#8E8E93" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {showEmojiPicker === post.id && (
                  <View style={styles.emojiPicker}>
                    {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiButton,
                          Array.isArray(post.post_reactions) && post.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
                        ]}
                        onPress={() => handleReaction(post.id, emoji)}
                      >
                        <Text style={styles.emojiButtonText}>{emoji}</Text>
                        {Array.isArray(post.post_reactions) && post.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                          <Text style={styles.emojiButtonCount}>
                            <Text>{post.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        {canCreatePost && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.createUpdate}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalToggle}>
            <Text style={styles.modalToggleLabel}>{t.postTo}</Text>
            <View style={styles.modalToggleButtons}>
              <TouchableOpacity
                style={[
                  styles.modalToggleButton,
                  activeTab === 'organization' && styles.modalToggleButtonActive
                ]}
                onPress={() => setActiveTab('organization')}
              >
                <Building2 
                  size={16} 
                  color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
                  strokeWidth={1.5} 
                />
                <Text style={[
                  styles.modalToggleButtonText,
                  activeTab === 'organization' && styles.modalToggleButtonTextActive
                ]}>
                  {t.organization}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalToggleButton,
                  activeTab === 'coach' && styles.modalToggleButtonActive
                ]}
                onPress={() => setActiveTab('coach')}
              >
                <Users 
                  size={16} 
                  color={activeTab === 'coach' ? '#1A1A1A' : '#8E8E93'} 
                  strokeWidth={1.5} 
                />
                <Text style={[
                  styles.modalToggleButtonText,
                  activeTab === 'coach' && styles.modalToggleButtonTextActive
                ]}>
                  {t.trainers}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder={t.updateTitle}
            value={newPost.title}
            onChangeText={(text) => setNewPost({ ...newPost, title: text })}
            placeholderTextColor="#8E8E93"
          />

          <TextInput
            style={styles.contentInput}
            placeholder={
              activeTab === 'organization' 
                ? "Was gibt es Neues in der Organisation?"
                : "Was passiert mit dem Team?"
            }
            value={newPost.content}
            onChangeText={(text) => setNewPost({ ...newPost, content: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />

          <TouchableOpacity
            style={styles.publishButton}
            onPress={handleCreatePost}
          >
            <Text style={styles.publishButtonText}>{t.publishUpdate}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        isVisible={isPostModalVisible}
        onBackdropPress={() => setPostModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.postDetails || 'Post Details'}</Text>
            <TouchableOpacity onPress={() => setPostModalVisible(false)}>
              <Text style={styles.cancelText}>{t.close}</Text>
            </TouchableOpacity>
          </View>

          {selectedPostForModal && (
            <ScrollView style={styles.postModalContent} showsVerticalScrollIndicator={false}>
              {/* Post Header */}
              <View style={styles.postModalHeader}>
                <Text style={styles.postModalDate}>
                  {formatDate(new Date(selectedPostForModal.created_at))}
                </Text>
                <View style={styles.postModalType}>
                  <Text style={styles.postModalTypeText}>
                    {selectedPostForModal.post_type === 'organization' ? t.organization : t.trainers}
                  </Text>
                </View>
              </View>

              {/* Post Title */}
              <Text style={styles.postModalTitle}>{selectedPostForModal.title}</Text>

              {/* Post Content */}
              <Text style={styles.postModalContentText}>{selectedPostForModal.content}</Text>

              {/* Post Image */}
              {selectedPostForModal.image_url && (
                <Image source={{ uri: selectedPostForModal.image_url }} style={styles.postModalImage} />
              )}

              {/* Post Reactions */}
              <View style={styles.postModalReactions}>
                <Text style={styles.postModalReactionsTitle}>{t.reactions}</Text>
                <View style={styles.postModalReactionsList}>
                  {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.length > 0 ? (
                    getTopReactions(selectedPostForModal.post_reactions).map(([emoji, count]) => (
                      <View key={emoji} style={styles.postModalReactionItem}>
                        <Text style={styles.postModalReactionEmoji}>{emoji}</Text>
                        <Text style={styles.postModalReactionCount}>{count}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.postModalNoReactions}>{t.noReactionsYet || 'No reactions yet'}</Text>
                  )}
                </View>
              </View>

              {/* Reaction Buttons */}
              <View style={styles.postModalActions}>
                <TouchableOpacity 
                  style={styles.postModalActionButton}
                  onPress={() => setShowEmojiPicker(showEmojiPicker === selectedPostForModal.id ? null : selectedPostForModal.id)}
                >
                  <Smile size={20} color="#007AFF" strokeWidth={1.5} />
                  <Text style={styles.postModalActionText}>{t.addReaction || 'Add Reaction'}</Text>
                </TouchableOpacity>
              </View>

              {/* Emoji Picker in Modal */}
              {showEmojiPicker === selectedPostForModal.id && (
                <View style={styles.emojiPicker}>
                  {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
                      ]}
                      onPress={() => {
                        handleReaction(selectedPostForModal.id, emoji);
                        // Update the modal post data
                        const updatedPost = posts.find(p => p.id === selectedPostForModal.id);
                        if (updatedPost) {
                          setSelectedPostForModal(updatedPost);
                        }
                      }}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                      {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                        <Text style={styles.emojiButtonCount}>
                          <Text>{selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

export default function InfohubScreen() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <InfohubScreenContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  toggleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 6,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Extra padding for floating button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postsContainer: {
    gap: 24,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postDate: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  moreButton: {
    padding: 4,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Urbanist-SemiBold',
    letterSpacing: -0.3,
  },
  postContent: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Urbanist-Regular',
  },
  postContentTruncated: {
    maxHeight: 66, // Approximately 3 lines
    overflow: 'hidden',
  },
  readMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'Urbanist-Medium',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  reactionEmojis: {
    flexDirection: 'row',
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  emojiButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  emojiButtonText: {
    fontSize: 18,
  },
  emojiButtonCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  modalToggle: {
    marginBottom: 24,
  },
  modalToggleLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    fontFamily: 'Urbanist-Regular',
  },
  modalToggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
  },
  modalToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modalToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalToggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'Urbanist-Medium',
  },
  modalToggleButtonTextActive: {
    color: '#1A1A1A',
  },
  titleInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
    fontFamily: 'Urbanist-Regular',
  },
  contentInput: {
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
    height: 120,
    marginBottom: 24,
    fontFamily: 'Urbanist-Regular',
  },
  publishButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    fontFamily: 'Urbanist-Regular',
    textAlign: 'center',
  },
  postModalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  postModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  postModalDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
  },
  postModalType: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postModalTypeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postModalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 16,
    lineHeight: 32,
  },
  postModalContentText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Urbanist-Regular',
    lineHeight: 24,
    marginBottom: 20,
  },
  postModalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  postModalReactions: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postModalReactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Urbanist-SemiBold',
    marginBottom: 12,
  },
  postModalReactionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  postModalReactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  postModalReactionEmoji: {
    fontSize: 18,
  },
  postModalReactionCount: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
  postModalNoReactions: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Urbanist-Regular',
    fontStyle: 'italic',
  },
  postModalActions: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 20,
  },
  postModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  postModalActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'Urbanist-Medium',
  },
});