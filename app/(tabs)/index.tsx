@@ .. @@
   const canCreatePost = user?.role === 'trainer' || user?.role === 'admin';

   const handleCreatePost = async () => {
-    if (!canCreatePost) {
-      Alert.alert(t.error, 'You do not have permission to create posts');
-      return;
-    }
+    // Check role-based permissions for post types
+    if (user?.role === 'player') {
+      Alert.alert(t.error, 'Players cannot create posts');
+      return;
+    }
+    
+    if (user?.role === 'trainer' && activeTab !== 'coach') {
+      Alert.alert(t.error, 'Trainers can only post to the Coach section');
+      return;
+    }
+    
+    if (user?.role === 'admin' && activeTab !== 'organization') {
+      Alert.alert(t.error, 'Admins can only post to the Organization section');
+      return;
+    }

     if (!user?.teamId || !user?.id) {
       Alert.alert(t.error, 'User authentication error. Please try logging in again.');
@@ .. @@
   const handleReaction = async (postId: string, emoji: string) => {
     if (!user?.id) return;

     try {
-      const existingReaction = posts
-        .find(p => p.id === postId)
-        ?.post_reactions?.find((r: any) => r?.user_id === user.id && r?.emoji === emoji);
+      const post = posts.find(p => p.id === postId);
+      if (!post) return;
+      
+      const existingReaction = post.post_reactions?.find((r: any) => 
+        r?.user_id === user.id && r?.emoji === emoji
+      );

       if (existingReaction) {
+        // Remove existing reaction
         await removePostReaction(postId, user.id, emoji);
       } else {
+        // First remove any other reaction from this user on this post
+        const userExistingReaction = post.post_reactions?.find((r: any) => 
+          r?.user_id === user.id
+        );
+        
+        if (userExistingReaction) {
+          await removePostReaction(postId, user.id, userExistingReaction.emoji);
+        }
+        
+        // Add new reaction
         await addPostReaction(postId, user.id, emoji);
       }
       
@@ .. @@
                   <View style={styles.actionButtons}>
                     <TouchableOpacity 
                       style={styles.actionButton}
-                      onPress={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
+                      onPress={(e) => {
+                        e.stopPropagation();
+                        setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id);
+                      }}
                     >
                       <Smile size={16} color="#8E8E93" strokeWidth={1.5} />
                     </TouchableOpacity>
                     
-                    <TouchableOpacity style={styles.actionButton}>
+                    <TouchableOpacity 
+                      style={styles.actionButton}
+                      onPress={(e) => {
+                        e.stopPropagation();
+                        // Future: implement comments functionality
+                      }}
+                    >
                       <MessageCircle size={16} color="#8E8E93" strokeWidth={1.5} />
                     </TouchableOpacity>
                   </View>
@@ .. @@
                     {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💪', '🎯', '⚡'].map((emoji) => (
                       <TouchableOpacity
                         key={emoji}
                         style={[
                           styles.emojiButton,
-                          Array.isArray(post.post_reactions) && post.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
+                          Array.isArray(post.post_reactions) && 
+                          post.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && 
+                          styles.emojiButtonActive
                         ]}
-                        onPress={() => handleReaction(post.id, emoji)}
+                        onPress={(e) => {
+                          e.stopPropagation();
+                          handleReaction(post.id, emoji);
+                        }}
                       >
                         <Text style={styles.emojiButtonText}>{emoji}</Text>
-                        {Array.isArray(post.post_reactions) && post.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
+                        {Array.isArray(post.post_reactions) && 
+                         post.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                           <Text style={styles.emojiButtonCount}>
-                            <Text>{post.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
+                            {post.post_reactions.filter((r: any) => r.emoji === emoji).length}
                           </Text>
                         )}
                       </TouchableOpacity>
@@ .. @@
         {/* Floating Action Button */}
-        {canCreatePost && (
+        {(user?.role === 'trainer' || user?.role === 'admin') && (
           <TouchableOpacity
             style={styles.floatingButton}
             onPress={() => setModalVisible(true)}
@@ .. @@
           <View style={styles.modalToggle}>
             <Text style={styles.modalToggleLabel}>{t.postTo}</Text>
             <View style={styles.modalToggleButtons}>
-              <TouchableOpacity
-                style={[
-                  styles.modalToggleButton,
-                  activeTab === 'organization' && styles.modalToggleButtonActive
-                ]}
-                onPress={() => setActiveTab('organization')}
-              >
-                <Building2 
-                  size={16} 
-                  color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
-                  strokeWidth={1.5} 
-                />
-                <Text style={[
-                  styles.modalToggleButtonText,
-                  activeTab === 'organization' && styles.modalToggleButtonTextActive
-                ]}>
-                  {t.organization}
-                </Text>
-              </TouchableOpacity>
+              {user?.role === 'admin' && (
+                <TouchableOpacity
+                  style={[
+                    styles.modalToggleButton,
+                    activeTab === 'organization' && styles.modalToggleButtonActive
+                  ]}
+                  onPress={() => setActiveTab('organization')}
+                >
+                  <Building2 
+                    size={16} 
+                    color={activeTab === 'organization' ? '#1A1A1A' : '#8E8E93'} 
+                    strokeWidth={1.5} 
+                  />
+                  <Text style={[
+                    styles.modalToggleButtonText,
+                    activeTab === 'organization' && styles.modalToggleButtonTextActive
+                  ]}>
+                    {t.organization}
+                  </Text>
+                </TouchableOpacity>
+              )}
               
-              <TouchableOpacity
-                style={[
-                  styles.modalToggleButton,
-                  activeTab === 'coach' && styles.modalToggleButtonActive
-                ]}
-                onPress={() => setActiveTab('coach')}
-              >
-                <Users 
-                  size={16} 
-                  color={activeTab === 'coach' ? '#1A1A1A' : '#8E8E93'} 
-                  strokeWidth={1.5} 
-                />
-                <Text style={[
-                  styles.modalToggleButtonText,
-                  activeTab === 'coach' && styles.modalToggleButtonTextActive
-                ]}>
-                  {t.trainers}
-                </Text>
-              </TouchableOpacity>
+              {user?.role === 'trainer' && (
+                <TouchableOpacity
+                  style={[
+                    styles.modalToggleButton,
+                    activeTab === 'coach' && styles.modalToggleButtonActive
+                  ]}
+                  onPress={() => setActiveTab('coach')}
+                >
+                  <Users 
+                    size={16} 
+                    color={activeTab === 'coach' ? '#1A1A1A' : '#8E8E93'} 
+                    strokeWidth={1.5} 
+                  />
+                  <Text style={[
+                    styles.modalToggleButtonText,
+                    activeTab === 'coach' && styles.modalToggleButtonTextActive
+                  ]}>
+                    {t.trainers}
+                  </Text>
+                </TouchableOpacity>
+              )}
             </View>
           </View>

@@ .. @@
           <TextInput
             style={styles.contentInput}
             placeholder={
-              activeTab === 'organization' 
+              user?.role === 'admin'
                 ? "Was gibt es Neues in der Organisation?"
                 : "Was passiert mit dem Team?"
             }
@@ .. @@
               <View style={styles.postModalActions}>
                 <TouchableOpacity 
                   style={styles.postModalActionButton}
-                  onPress={() => setShowEmojiPicker(showEmojiPicker === selectedPostForModal.id ? null : selectedPostForModal.id)}
+                  onPress={() => {
+                    setShowEmojiPicker(showEmojiPicker === selectedPostForModal.id ? null : selectedPostForModal.id);
+                  }}
                 >
                   <Smile size={20} color="#007AFF" strokeWidth={1.5} />
                   <Text style={styles.postModalActionText}>{t.addReaction || 'Add Reaction'}</Text>
@@ .. @@
                     <TouchableOpacity
                       key={emoji}
                       style={[
                         styles.emojiButton,
-                        Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && styles.emojiButtonActive
+                        Array.isArray(selectedPostForModal.post_reactions) && 
+                        selectedPostForModal.post_reactions.some((r: any) => r.user_id === user?.id && r.emoji === emoji) && 
+                        styles.emojiButtonActive
                       ]}
                       onPress={() => {
                         handleReaction(selectedPostForModal.id, emoji);
@@ -1,6 +1,6 @@
                       }}
                     >
                       <Text style={styles.emojiButtonText}>{emoji}</Text>
-                      {Array.isArray(selectedPostForModal.post_reactions) && selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
+                      {Array.isArray(selectedPostForModal.post_reactions) && 
+                       selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length > 0 && (
                         <Text style={styles.emojiButtonCount}>
-                          <Text>{selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length}</Text>
+                          {selectedPostForModal.post_reactions.filter((r: any) => r.emoji === emoji).length}
                         </Text>
                       )}
                     </TouchableOpacity>