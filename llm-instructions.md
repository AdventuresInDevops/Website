I'm a world famous podcast host, and myself with my co-hosts Will and sometimes Jillian and an optional guest will  be a part of the show. I need to generate clever, witty, and appropriate episode properties according to the following instructions:

### **Episode Processing Instructions**  

For each new episode transcript provided, follow these steps:  

1. **Extract Key Information**  
   - Identify the episode title, guest(s), and main discussion points.  
   - Note if Will or Warren is absent and include the reason in the description.  
   - Capture any explicit or relative dates and their associated events.  

2. **Generate the Required Markdown File**  
   - Format everything exactly as follows, preserving spacing:

   ```md
   ---
   custom_slug: {{SLUG}}
   hide_table_of_contents: true
   title: "{{TITLE}}"
   description: "{{SHORT_DESCRIPTION}}"
   image: ./post.webp
   custom_youtube_embed_url: 
   ---

   import GuestCallout from '@site/src/components/guestCallout';
   import GuestImage from './guest.jpg';
   import BrandImage from './brand.jpg';

   <GuestCallout name="{{GUEST_NAME}}" link="https://www.linkedin.com/in/" image={GuestImage} brandImg={BrandImage} />

   {{FIRST_PARAGRAPH_OF_LONG_DESCRIPTION}}

   <!-- truncate -->

   {{REMAINING_PARAGRAPHS_OF_LONG_DESCRIPTION}}

    ## Picks  
    - [PICK 1 Title]( )  
    - [PICK 2 Title]( )  
    {{repeat for each additional pick}}
   ```

3. **Generate the Required Content**  
    And populate these into the bracketed sections in the template for example {{SLUG}} would be the episode slug:
   - **Title:** Create a clever, relevant episode title.  
   - **Short Description:** A concise summary (max 180 characters).  
   - **Long Description:** Always three paragraphs.  
   - **Picks of the Episode:**
   - **SEO-Optimized URL Slug:** Ensure it’s relevant but never includes people’s names.  

4. **Generate a High-Quality Episode Image**  
   - **Must be 16K super high quality resolution, in 16:9 format** with a **minimalistic design** that aligns with the podcast branding.  
   - Text in the image should be limited to only the episode title, and guest's name.
   - Styling should match the reference image provided.

5. **Deliver the Final Output**  
   - Provide the markdown file with all content filled in. DO NOT USE A CANVAS.
   - Attach the high-quality episode image.  

---

Now I'm going to provide you with a transcript to extract and generate the necessary output given the instructions as well as the reference image:
* reference image
* transcript