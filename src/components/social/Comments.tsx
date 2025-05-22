import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
import { getComments, createComment, Comment as CommentType } from '../../services/comments';

interface CommentsProps {
  factId: string;
  onAuthRequired: () => void;
}

const db = getFirestore();

interface CommentWithReactions extends CommentType {
  likes: number;
  dislikes: number;
  userReaction?: 'like' | 'dislike' | null;
}

const Comments: React.FC<CommentsProps> = ({ factId, onAuthRequired }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithReactions[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'controversial'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [factId]);

  const loadComments = async () => {
    try {
      const fetchedComments = await getComments(factId);
      const commentsWithReactions: CommentWithReactions[] = fetchedComments.map(comment => ({
        ...comment,
        likes: 0,
        dislikes: 0,
        userReaction: null
      }));
      setComments(commentsWithReactions);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    try {
      const newCommentData = await createComment(factId, newComment);
      if (newCommentData) {
        const commentWithReactions: CommentWithReactions = {
          ...newCommentData,
          likes: 0,
          dislikes: 0,
          userReaction: null
        };
        setComments([commentWithReactions, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };
  
  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) return;
    
    try {
      const commentRef = doc(db, 'comments', commentId);
      
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          const newComment = { ...comment };
          
          if (comment.userReaction === type) {
            // Remove reaction
            newComment.userReaction = null;
            newComment[type === 'like' ? 'likes' : 'dislikes']--;
            updateDoc(commentRef, {
              [`${type}s`]: increment(-1)
            });
          } else {
            // Add new reaction, remove opposite if exists
            if (comment.userReaction) {
              // Remove old reaction
              newComment[comment.userReaction === 'like' ? 'likes' : 'dislikes']--;
              updateDoc(commentRef, {
                [`${comment.userReaction}s`]: increment(-1)
              });
            }
            
            // Add new reaction
            newComment.userReaction = type;
            newComment[type === 'like' ? 'likes' : 'dislikes']++;
            updateDoc(commentRef, {
              [`${type}s`]: increment(1)
            });
          }
          
          return newComment;
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };
  
  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Sort by controversy (sum of likes and dislikes)
      return (b.likes + b.dislikes) - (a.likes + a.dislikes);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Sort options */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-sm text-gray-400 mr-2">Trier par:</span>
        <button 
          onClick={() => setSortBy('recent')}
          className={`text-sm px-3 py-1 rounded-full mr-2 ${
            sortBy === 'recent' 
              ? 'bg-purple-900/50 text-purple-300' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Récent
        </button>
        <button 
          onClick={() => setSortBy('controversial')}
          className={`text-sm px-3 py-1 rounded-full ${
            sortBy === 'controversial' 
              ? 'bg-purple-900/50 text-purple-300' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Controversé
        </button>
      </div>
      
      {/* Comment form */}
      {user ? (
        <form onSubmit={handleComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Partagez votre avis..."
            className="w-full px-4 py-3 text-gray-200 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          ></textarea>
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Commenter
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-gray-300 text-center">
            <button 
              onClick={onAuthRequired}
              className="text-purple-400 hover:text-purple-300"
            >
              Connectez-vous
            </button> pour laisser un commentaire.
          </p>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-6">
        {sortedComments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Aucun commentaire pour le moment. Soyez le premier à réagir!</p>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-800 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-200">{comment.user?.displayName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(comment.createdAt).toLocaleDateString()} à {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <button className="text-gray-500 hover:text-gray-400">
                  <Flag size={14} />
                </button>
              </div>
              
              <p className="text-gray-300 mb-3">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleReaction(comment.id, 'like')}
                  className={`flex items-center gap-1 text-sm ${
                    comment.userReaction === 'like' 
                      ? 'text-green-400' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <ThumbsUp size={14} />
                  <span>{comment.likes}</span>
                </button>
                
                <button 
                  onClick={() => handleReaction(comment.id, 'dislike')}
                  className={`flex items-center gap-1 text-sm ${
                    comment.userReaction === 'dislike' 
                      ? 'text-red-400' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <ThumbsDown size={14} />
                  <span>{comment.dislikes}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;