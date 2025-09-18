# Aice PS - AI Image Editor

Aice PS is a powerful web-based AI photo editor that leverages Google AI Studio's advanced capabilities to make professional-level image editing and creation simple and intuitive. Users can retouch images, apply creative filters, make professional adjustments, and even generate entirely new images from scratch through simple text prompts.

![Aice PS Interface Screenshot](public/images/show.jpg)

## Note: Using Gemini API key incurs charges. However, calling the API directly from environment variables is free. [Recommended cost-effective API platform - 2¢ per image, HD 12¢](https://nb2.kuai.host/)

### [AI Studio 【NanoBanana APP】](https://ai.studio/apps/drive/1JSVTWc7Pe1GfLLrQcBWPZF_yH_80xUGg) 

> If you're logged into Google AI Studio, you can directly open the app above. Completely free.

### [【Self-deployable Version DEMO】https://nb2.kuai.host/](https://nb2.kuai.host/)

> #### Self-deployable version, directly usable in China, comes with cost-effective Banana API, recommended for use.

> #### Please use your own Gemini API key with caution. [Recommended cost-effective API platform](https://cnb.build/no.1/api/-/issues/2)

 [【Video Tutorial】](https://www.bilibili.com/video/BV1hwahzNEhC/)  [【Discussion Group】](https://cnb.cool/fuliai/comfyui/-/issues/11) 

## For prompts used in the video, please check the【Template Library】in the APP

## ✨ Main Features

Aice PS combines multiple cutting-edge AI capabilities to provide you with a one-stop creative image and video solution:

-   **🚀 AI Image Generation**: Enter any text description to create detail-rich, creative high-quality images with the `Imagen 4` model, supporting multiple aspect ratios.
-   **✍️ Smart Retouch (Local Editing)**: Easily click on specific locations in images and make precise, seamless local modifications through simple text commands (like "remove this object" or "change the shirt to red").
-   **🎨 Creative Filters & Professional Adjustments**: One-click application of various artistic style filters like anime, synthwave, Lomo, or professional image adjustments like background blur, detail enhancement, and lighting effects.
-   **💡 AI Inspiration Suggestions**: Not sure where to start? AI intelligently analyzes your images and recommends the most suitable filters, adjustments, and texture effects tailored for you, sparking your creative inspiration.
-   **🧩 Smart Fusion**: Upload multiple images and describe in one sentence how to seamlessly blend different elements (like characters, backgrounds, styles) together to create entirely new composite images.
-   **🧱 Texture Overlay**: Add various realistic creative textures to images, such as cracked paint, wood grain, brushed metal, etc., instantly enhancing image quality.
-   **✂️ One-Click Background Removal**: Powerful AI automatically identifies and removes image backgrounds, generating PNG images with transparent channels in one click, perfect for design and compositing.
-   **🕰️ Past Forward (Time Travel)**: Upload a portrait photo, and AI will take you through time, generating realistic appearances of you from the 1950s to 2000s across different decades.
-   **🎵 BeatSync**: Upload an image and a piece of music, AI will automatically generate multiple stylized image sets and create video clips with cool transition effects synced to the music beat in one click.
-   **📚 Template Library**: Built-in searchable, paginated template library providing rich creative starting points. Click on templates to load preset images and prompts, easily beginning your creative journey.
-   **🛠️ Basic Editing Suite**: Provides unlimited cropping, undo/redo, real-time original image comparison, save and download functions to meet your daily editing needs.

## 🛠️ Tech Stack

- **Frontend**: React 19 (loaded via esm.sh, no build step)
- **Language**: TypeScript
- **AI Models**: Google Gemini API (`gemini-2.5-flash-image-preview`, `imagen-4.0-generate-001`, `gemini-2.5-flash`)
- **Styling**: Tailwind CSS (via CDN)
- **Component Library**: `react-image-crop`

## 🎨 Core AI Model Introduction

Aice PS's powerful features are driven by Google's most advanced series of generative AI models, each playing a key role in specific tasks.

### Gemini 2.5 Flash Image (`gemini-2.5-flash-image-preview`)

This model is the engine behind all core **image editing features** of Aice PS, also known as "Nano Banana". It's not just an image generator, but a contextual editor that can deeply understand image content and perform precise operations based on natural language instructions.

Its main advantages include:

-   **Advanced Reasoning & Contextual Understanding**: The model can "think" about user editing intentions like humans. For example, when asked to visualize "a lasagna that has been baking in the oven for 4 days," it generates a burnt, smoking lasagna rather than a perfect finished product, demonstrating its excellent logical reasoning capabilities.
-   **Excellent Character & Scene Consistency**: When performing multiple edits or generating series of images, it maintains high consistency in main characters and scene styles. This is crucial for storytelling, video shot generation, or brand asset design.
-   **Precise Local Editing**: Users can specify a point on an image and describe modifications in natural language (e.g., "remove this person" or "add stripes to this shirt"), and the model performs seamless, realistic modifications while keeping other parts of the image unchanged.
-   **Text & Detail Processing**: Can recognize and modify text within images, such as changing newspaper headlines or product labels while maintaining original fonts and styles. It can also restore old photos, eliminate motion blur, and preserve key details.
-   **Multi-image Fusion**: The model can understand and fuse multiple input images, such as placing an object into a new scene or replacing a room's style with textures from another image.

## ⚠️ API Key Usage Instructions
Please note that if you provide your own Google Gemini API key in settings, API calls made through that key will **incur charges**. If left empty, the app will attempt to use the API key configured in environment variables during deployment (which may be free or paid by yourself). Please configure carefully based on your usage situation.

### TODO
- [x] Google AI Studio APP, relatively complete and user-friendly free Nano Banana APP
- [x] Support multi-image fusion
- [x] Generate complete sets of young and old versions from one image (Past Forward)
- [x] Add BeatSync feature page: stylized image sets, one-click video creation with beat sync
- [x] Add paste image upload feature, automatically upload when pasting images on homepage
- [x] Add template feature (Template Library)
- [x] Prompt collection center (Template Library)
- [x] Re-support Gemini API, everyone can self-deploy and use Gemini API-compatible APIs. [Recommended cost-effective API platform with lower source prices](https://cnb.build/no.1/api/-/issues/2)
- [x] Fix image upload size limit being too small
- [x] Upgrade 3-image fusion to 4-image fusion
- [] Continuously adding prompt templates (in progress)
- [] Cheese Banana feature - planned
- [] Integration with third-party platform APIs
- [] ...


###  [【Video Tutorial】](https://www.bilibili.com/video/BV1hwahzNEhC/)  [【Discussion Group】](https://cnb.cool/fuliai/comfyui/-/issues/11) 

## 📄 License

This project is licensed under [Apache-2.0](./LICENSE).