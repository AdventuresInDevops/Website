import type { LoadContext, Plugin } from '@docusaurus/types';

export default function myPlugin(context: LoadContext): Plugin {
  return {
    name: 'recommendedEpisodesPlugin',
    
    async allContentLoaded({ allContent, actions }) {
      // This lifecycle hook has allContent!
      const { setGlobalData, createData } = actions;
      
      const blogPlugin = allContent['docusaurus-plugin-content-blog']?.default;
      
      if (!blogPlugin) {
        return;
      }
      
      // Create second file - the blog posts data
      const blogPosts = blogPlugin.blogPosts.map((post: any) => ({
        id: post.id,
        title: post.metadata.title,
        permalink: post.metadata.permalink,
        date: post.metadata.date,
        description: post.metadata.description,
        tags: post.metadata.tags,
      }));
      
      await createData('blog-posts.json', JSON.stringify(blogPosts, null, 2));
      
      // Also set global data for usePluginData hook
      setGlobalData({ blogPosts });
    },
  };
}