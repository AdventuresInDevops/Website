import type { LoadContext, Plugin } from '@docusaurus/types';
import path from 'path';
import fs from 'fs-extra';

export default function myPlugin(context: LoadContext): Plugin {
  let blogPostsData: any[] = [];
  
  return {
    name: 'recommendedEpisodesPlugin',
    
    async allContentLoaded({ allContent, actions }) {
      // This lifecycle hook has allContent!
      const { setGlobalData, createData } = actions;
      
      const blogPlugin = allContent['docusaurus-plugin-content-blog']?.default;
      
      if (!blogPlugin) {
        return;
      }
      
      // Create the images module
      const imageRequires = blogPlugin.blogPosts
        .filter((post: any) => post.metadata.frontMatter.image)
        .map((post: any) => {
          const imagePath = post.metadata.frontMatter.image;
          const postDir = path.dirname(post.metadata.source);
          const relativeToSite = path.join(postDir, imagePath);
          
          return `  '${post.id}': require('${relativeToSite}').default,`;
        })
        .join('\n');
      
      const imagesModule = `module.exports = {\n${imageRequires}\n};`;
      
      // Create first file - the images module
      await createData('blog-images.js', imagesModule);
      
      // Create second file - the blog posts data
      const blogPosts = blogPlugin.blogPosts.map((post: any) => ({
        id: post.id,
        title: post.metadata.title,
        permalink: post.metadata.permalink,
        date: post.metadata.date,
        description: post.metadata.description,
        tags: post.metadata.tags,
        hasImage: !!post.metadata.frontMatter.image,
      }));
      
      await createData('blog-posts.json', JSON.stringify(blogPosts, null, 2));
      
      // Also set global data for usePluginData hook
      setGlobalData({ blogPosts });
    },
  };
}