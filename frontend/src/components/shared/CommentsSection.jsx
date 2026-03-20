import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Send, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function CommentsSection({ entityType, entityId }) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => appClient.entities.Comment.filter({ entity_type: entityType, entity_id: entityId }),
    enabled: !!entityId
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list()
  });

  const createCommentMutation = useMutation({
    mutationFn: async (text) => {
      // Extract mentions (@email)
      const mentionRegex = /@(\S+@\S+\.\S+)/g;
      const mentions = [...text.matchAll(mentionRegex)].map(match => match[1]);
      
      return appClient.entities.Comment.create({
        entity_type: entityType,
        entity_id: entityId,
        text,
        mentions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment);
    }
  };

  const insertMention = (email) => {
    setNewComment(prev => prev + `@${email} `);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Комментарии</h3>
      
      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                {comment.created_by?.charAt(0).toUpperCase() || '?'}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-700">{comment.created_by}</span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true, locale: ru })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Комментариев нет</p>
        )}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Добавьте комментарий... Используйте @email для упоминания"
            rows={3}
            className="pr-10"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                const email = prompt('Введите email для упоминания:');
                if (email) insertMention(email);
              }}
            >
              <AtSign className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-400">
            💡 Используйте @email для упоминания
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={!newComment.trim() || createCommentMutation.isPending}
          >
            <Send className="w-4 h-4 mr-1" /> Отправить
          </Button>
        </div>
      </form>
    </div>
  );
}