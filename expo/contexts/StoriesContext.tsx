import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Story, ShopWithStories } from '@/types';
import { useApp } from './AppContext';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/stories';
const QUERY_KEY = ['stories'] as const;

export const [StoriesProvider, useStories] = createContextHook(() => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      console.log('[Stories] Loading stories from storage');
      const data = await loadFromStorage<Story[]>(STORAGE_KEY);
      if (!data) return [];
      const now = new Date();
      const validStories = data.filter((story) => new Date(story.expiresAt) > now);
      if (validStories.length !== data.length) {
        await saveToStorage(STORAGE_KEY, validStories);
      }
      return validStories;
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newStories: Story[]) => {
      await saveToStorage(STORAGE_KEY, newStories);
      return newStories;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  const addStory = useCallback(async (videoUrl: string, thumbnail?: string): Promise<string> => {
    if (!user) throw new Error('User not found');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const newStory: Story = {
      id: `story-${Date.now()}`,
      shopId: user.id,
      shopName: user.shopInfo?.name || user.name,
      shopPhoto: user.photo,
      videoUrl,
      thumbnail,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      viewed: false,
    };

    const current = queryClient.getQueryData<Story[]>(QUERY_KEY) ?? [];
    saveMutation.mutate([...current, newStory]);
    console.log('[Stories] Story added:', newStory.id);
    return newStory.id;
  }, [user, queryClient, saveMutation]);

  const deleteStory = useCallback(async (storyId: string) => {
    const current = queryClient.getQueryData<Story[]>(QUERY_KEY) ?? [];
    saveMutation.mutate(current.filter(s => s.id !== storyId));
    console.log('[Stories] Story deleted:', storyId);
  }, [queryClient, saveMutation]);

  const markStoryAsViewed = useCallback(async (storyId: string) => {
    const current = queryClient.getQueryData<Story[]>(QUERY_KEY) ?? [];
    saveMutation.mutate(current.map(s => s.id === storyId ? { ...s, viewed: true } : s));
  }, [queryClient, saveMutation]);

  const getShopStories = useCallback((shopId: string): Story[] => {
    return stories
      .filter(s => s.shopId === shopId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [stories]);

  const myStories = useMemo(() => {
    if (!user) return [];
    return getShopStories(user.id);
  }, [user, getShopStories]);

  const groupedStories = useMemo((): ShopWithStories[] => {
    const shopMap = new Map<string, ShopWithStories>();

    stories.forEach(story => {
      if (!shopMap.has(story.shopId)) {
        shopMap.set(story.shopId, {
          shopId: story.shopId,
          shopName: story.shopName,
          shopPhoto: story.shopPhoto,
          stories: [],
          hasUnviewed: false,
        });
      }
      const shopStories = shopMap.get(story.shopId)!;
      shopStories.stories.push(story);
      if (!story.viewed) {
        shopStories.hasUnviewed = true;
      }
    });

    return Array.from(shopMap.values()).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      const aLatest = Math.max(...a.stories.map(s => new Date(s.createdAt).getTime()));
      const bLatest = Math.max(...b.stories.map(s => new Date(s.createdAt).getTime()));
      return bLatest - aLatest;
    });
  }, [stories]);

  return useMemo(() => ({
    stories,
    isLoading,
    addStory,
    deleteStory,
    markStoryAsViewed,
    getShopStories,
    myStories,
    groupedStories,
  }), [
    stories,
    isLoading,
    addStory,
    deleteStory,
    markStoryAsViewed,
    getShopStories,
    myStories,
    groupedStories,
  ]);
});
