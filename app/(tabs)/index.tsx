import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Plus, Building2, Users, Smile, MessageCircle, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createPost, getPosts, addPostReaction, removePostReaction } from '@/lib/supabase';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  author_id: string;
  team_id: string;
  post_type: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
  post_reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

export default function InfoHub() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState<Post | null>(null);
  const [activeTab, setActiveTab] = useState<'organization' | 'coach'>('organization');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert(t.error, 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = async () => {
    // Check role-based permissions for post types
    if (user?.role === 'player') {
      Alert.alert(t.error, 'Players cannot create posts');
      return;
    }
    
    if (user?.role === 'trainer' && activeTab !== 'coach') {
      Alert.alert(t.error, 'Trainers can only post to the Coach section');
      return;
    }
    
    if (user?.role === 'admin' && activeTab !== 'organization') {
      Alert.alert(t.error, 'Admins can only post to the Organization section');
      return;
    }

    if (!user?.teamId || !user?.id) {
      Alert.alert(t.error, 'User authentication error. Please try logging in again.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert(t.error, 'Please fill in all fields');
      return;
    }

    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        team_id: user.teamId,
        post_type: activeTab,
      });

      setTitle('');
      setContent('');
      setModalVisible(false);
      loadPosts();
      Alert.alert(t.success, 'Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(t.error, 'Failed to create post');
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const existingReaction = post.post_reactions?.find((r: any) => 
        r?.user_id === user.id && r?.emoji === emoji
      );

      if (existingReaction) {
        // Remove existing reaction
        await removePostReaction(postId, user.id, emoji);
      } else {
        // First remove any other reaction from this user on this post
        const userExistingReaction = post.post_reactions?.find((r: any) => 
          r?.user_id === user.id
        );
        
        if (userExistingReaction) {
          await removePostReaction(postId, user.id, userExistingReaction.emoji);
        }
        
        // Add new reaction
        await addPostReaction(postId, user.id, emoji);
      }
      
      // Refresh posts to show updated reactions
      loadPosts();
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert(t.error, 'Failed to update reaction');
    }
  };

  const filteredPosts = posts.filter(post => post.post_type === activeTab);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openPostModal = (post: Post) => {
    setSelectedPostForModal(post);
    setPostModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.infohub}</Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'organization' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('organization')}
        >
          <Building2 
            size={16} 
            color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
            strokeWidth={1.5} 
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'organization' && styles.tabButtonTextActive
          ]}>
            {t.organization}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'coach' && styles.tabButtonActive
          ]}
          onPress={() => setActiveTab('coach')}
        >
          <Users 
            size={16} 
            color={activeTab === 'coach' ? '#1A1A1A' : '#8E8E93'} 
            strokeWidth={1.5} 
          />
          <Text style={[
            styles.tabButtonText,
            activeTab === 'coach' && styles.tabButtonTextActive
          ]}>
            {t.trainers}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <ScrollView 
        style={styles.postsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeTab === 'organization' ? t.noOrganizationPosts : t.noCoachPosts}
            </Text>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <TouchableOpacity 
              key={post.id} 
              style={styles.postCard}
              onPress={() => openPostModal(post)}
            >
              <View style={styles.postHeader}>
                <View style={styles.postAuthor}>
                  <Text style={styles.authorName}>
                    {post.author?.first_name} {post.author?.last_name}
                  </Text>
                  <Text style={styles.postDate}>
                    {formatDate(post.created_at)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent} numberOfLines={3}>
                {post.content}
              </Text>
              
              {post.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.postImage} />
              )}

              {/* Reactions Display */}
              {Array.isArray(post.post_reactions) && post.post_reactions.length > 0 && (
                <View style={styles.reactionsDisplay}>
                  {Object.entries(
                    post.post_reactions.reduce((acc: any, reaction: any) => {
                      if (!acc[reaction.emoji]) {
                        acc[reaction.emoji] = [];
                      }
                      acc[reaction.emoji].push(reaction);
                      return acc;
                    }, {})
                  ).map(([emoji, reactions]: [string, any]) => (
                    <View key={emoji} style={styles.reactionSummary}>
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      <Text style={styles.reactionCount}>{reactions.length}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.postFooter}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id);
                    }}
                  >
                    <Smile size={16} color="#8E8E93" strokeWidth={1.5} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Future: implement comments functionality
                    }}
                  >
                    <MessageCircle size={16} color="#8E8E93" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>

                {/* Emoji Picker */}
                {showEmojiPicker === post.id && (
                  <View style={styles.emojiPicker}>
                    {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.emojiButton,
                          Array.isArray(post.post_reactions) && 
                          post.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && 
                          styles.emojiButtonActive
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, emoji);
                        }}
                      >
                        <Text style={styles.emojiButtonText}>{emoji}</Text>
                        {Array.isArray(post.post_reactions) && 
                         post.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                          <Text style={styles.emojiButtonCount}>
                            {post.post_reactions.filter((r: any) => r.emoji === emoji).length}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {(user?.role === 'trainer' || user?.role === 'admin') && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelButton}>{t.cancel}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.createPost}</Text>
            <TouchableOpacity onPress={handleCreatePost}>
              <Text style={styles.modalSaveButton}>{t.post}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalToggle}>
            <Text style={styles.modalToggleLabel}>{t.postTo}</Text>
            <View style={styles.modalToggleButtons}>
              {user?.role === 'admin' && (
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
              )}
              
              {user?.role === 'trainer' && (
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
              )}
            </View>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder={t.postTitle}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#8E8E93"
            />
            
            <TextInput
              style={styles.contentInput}
              placeholder={
                user?.role === 'admin'
                  ? "Was gibt es Neues in der Organisation?"
                  : "Was passiert mit dem Team?"
              }
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholderTextColor="#8E8E93"
            />
          </View>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)}>
              <X size={24} color="#007AFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t.post}</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedPostForModal && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.postModalHeader}>
                <Text style={styles.postModalAuthor}>
                  {selectedPostForModal.author?.first_name} {selectedPostForModal.author?.last_name}
                </Text>
                <Text style={styles.postModalDate}>
                  {formatDate(selectedPostForModal.created_at)}
                </Text>
              </View>
              
              <Text style={styles.postModalTitle}>{selectedPostForModal.title}</Text>
              <Text style={styles.postModalContent}>{selectedPostForModal.content}</Text>
              
              {selectedPostForModal.image_url && (
                <Image 
                  source={{ uri: selectedPostForModal.image_url }} 
                  style={styles.postModalImage} 
                />
              )}

              {/* Reactions in Modal */}
              {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.length > 0 && (
                <View style={styles.postModalReactions}>
                  <Text style={styles.postModalReactionsTitle}>{t.reactions || 'Reactions'}</Text>
                  <View style={styles.reactionsDisplay}>
                    {Object.entries(
                      selectedPostForModal.post_reactions.reduce((acc: any, reaction: any) => {
                        if (!acc[reaction.emoji]) {
                          acc[reaction.emoji] = [];
                        }
                        acc[reaction.emoji].push(reaction);
                        return acc;
                      }, {})
                    ).map(([emoji, reactions]: [string, any]) => (
                      <View key={emoji} style={styles.reactionSummary}>
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        <Text style={styles.reactionCount}>{reactions.length}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.postModalActions}>
                <TouchableOpacity 
                  style={styles.postModalActionButton}
                  onPress={() => {
                    setShowEmojiPicker(showEmojiPicker === selectedPostForModal.id ? null : selectedPostForModal.id);
                  }}
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
                        Array.isArray(selectedPostForModal.post_reactions) && 
                        selectedPostForModal.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && 
                        styles.emojiButtonActive
                      ]}
                      onPress={() => {
                        handleReaction(selectedPostForModal.id, emoji);
                        setShowEmojiPicker(null);
                      }}
                    >
                      <Text style={styles.emojiButtonText}>{emoji}</Text>
                      {Array.isArray(selectedPostForModal.post_reactions) && 
                       selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                        <Text style={styles.emojiButtonCount}>
                          {selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  tabButtonActive: {
    backgroundColor: '#E5E5EA',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabButtonTextActive: {
    color: '#1A1A1A',
  },
  postsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAuthor: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  postDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  emojiButtonActive: {
    backgroundColor: '#007AFF',
  },
  emojiButtonText: {
    fontSize: 16,
    marginRight: 4,
  },
  emojiButtonCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancelButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSaveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalToggle: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalToggleButtons: {
    flexDirection: 'row',
  },
  modalToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  modalToggleButtonActive: {
    backgroundColor: '#E5E5EA',
  },
  modalToggleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  modalToggleButtonTextActive: {
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    height: 200,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  postModalHeader: {
    marginBottom: 16,
  },
  postModalAuthor: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  postModalDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  postModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  postModalContent: {
    fontSize: 16,
    color: '#3C3C43',
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
  },
  postModalReactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  postModalActions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 20,
    marginBottom: 20,
  },
  postModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  postModalActionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});