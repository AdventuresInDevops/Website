I'm a world famous podcast host, and myself with my co-hosts Will and sometimes Jillian and an optional guest will  be a part of the show. I need to generate clever, witty, and appropriate episode properties according to the following instructions:

### **Episode Processing Instructions**  

For each new episode transcript provided, follow these steps:  

1. **Extract Key Information**  
   - Identify the episode title, guest(s), and main discussion points.  
   - Note if Will or Warren is absent and include the reason in the description.  
   - Capture any explicit or relative dates and their associated events.

2. **Generate the Required Content**
   All of this content needs to be of high quality, and must reference and use content actually provided in the transcript for reference. Do not pull in information from anywhere else.
   - **Title:** Create a clever, relevant episode title, that has great SEO.
   - **Short Description:** A concise summary (max 180 characters).
   - **Long Description:** Use the extracted main discussion topics to generate a long description for the episode. It should Always three paragraphs.
   - **Picks of the Episode:** At the end of the transcript the people in the episode will discuss PICKs. Extract all the picks form the episode.
   - **SEO-Optimized URL Slug:** Ensure it’s relevant but never includes people’s names.

3. **Deliver the Final Output**  
   - Using the extracted required content from step 2. Create a markdown file with all content filled in. You will use the following markdown template.
   - Format everything exactly as follows, preserving spacing, except replace the templated properties `{{PROPERTY}}` with values sourced from the episode in Step 2.:

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
    - [PICK 1 Title]()
    - [PICK 2 Title]()
    - [PICK 3 Title]()
    - [PICK 4 Title]()
   ```

Here is the transcript:

---

Now based on all of that we are going to generate an episode image that aligns with the podcast episode.
- The image **Must be 16K super high quality resolution** and **in a 16:9 format** with a **minimalistic design**. Text in the image should be limited to only the episode title, and guest's name.
- Lastly the Styling and branding should be similar to the the reference image provided reference image.

Here is the reference image that includes branding that matches the podcast. Now generate me the podcast episode image.