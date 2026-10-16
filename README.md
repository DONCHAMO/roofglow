[README.md](https://github.com/user-attachments/files/33569807/README.md)
# RoofGlow: Webflow deployment guide

RoofGlow is the roofline measuring and Christmas light preview tool for Long Island Christmas Lights Pros. It's plain HTML, CSS, and JavaScript with no frameworks or build step.

## The files

| File | What it is | Where it goes |
|---|---|---|
| `roofglow.html` | The embed code: the HTML structure plus links to the CSS and JS. About 11,000 characters. | Pasted into a Webflow Code Embed |
| `roofglow.css` | All styling, scoped to RoofGlow | Hosted on GitHub, served by jsDelivr |
| `roofglow.js` | All functionality | Hosted on GitHub, served by jsDelivr |
| `roofglow-local-test.html` | A test page that loads the CSS and JS from the same folder | Your computer only, for testing |

Webflow's Assets panel doesn't accept `.css` or `.js` files, and the JavaScript file is far over the 50,000-character embed limit. So the CSS and JS are hosted on GitHub and delivered through jsDelivr, a free CDN for files in public GitHub repositories. Visitors never leave your site: the page lives at `yoursite.com/roofglow`, and the browser quietly loads the two files in the background.

## Step 1: Put the files on GitHub (one time, about 10 minutes)

1. Create a free account at github.com if you don't have one.
2. Click **New repository**. Name it exactly `roofglow`, set it to **Public**, and click **Create repository**. jsDelivr can only serve files from public repositories.
3. On the new repository page, click **uploading an existing file**. Drag in `roofglow.css`, `roofglow.js`, and this README, then click **Commit changes**.
4. Create a version tag. On the repository page, click **Releases**, then **Create a new release**. Under **Choose a tag**, type `1.1.0`, choose **Create new tag**, and click **Publish release**.

Your files are now available at:

```
https://cdn.jsdelivr.net/gh/YOUR-GITHUB-USERNAME/roofglow@1.1.0/roofglow.css
https://cdn.jsdelivr.net/gh/YOUR-GITHUB-USERNAME/roofglow@1.1.0/roofglow.js
```

Open both links in your browser, with your username in place. Each should show the file's code. If you see an error, check that the repository is public and the tag is exactly `1.1.0`.

## Step 2: Prepare the embed code

Open `roofglow.html` in a text editor. Replace `YOUR-GITHUB-USERNAME` with your GitHub username in the two URLs: the stylesheet link near the top and the script tag at the bottom. Save the file.

## Step 3: Create the /roofglow page in Webflow

1. In the Webflow Designer, open the **Pages** panel and create a new static page.
2. In its page settings, set the slug to `roofglow` and save.
3. Add your usual navbar and footer if they aren't already part of a page template.
4. Add a **Section**. Inside it, add a **Container** for a 940 px layout, or nothing extra for full width. RoofGlow adapts to either.
5. Drag a **Code Embed** element into it. Paste the entire contents of `roofglow.html` and click **Save & Close**.
6. **Publish** the site.

The Designer shows the embed as a gray box. Scripts in Code Embeds only run on the published site, so test on your live domain or your `webflow.io` staging address. Webflow requires a paid Site plan to publish custom code.

## Step 4: Test on the live page

Go to `yoursite.com/roofglow` and run through everything:

- Upload a photo and set the scale.
- Trace runs. Click each corner, then click the last point again, press Enter, or tap Finish run.
- Add a second string, add a run by hand, and change the light settings.
- Check that the totals, Copy summary, and Start over all work.
- In the night preview, try the compare slider, darkness, brightness, light effects, snow, the Animate checkbox, colors, and Download image.
- Check the page on a phone and a tablet.

## Updating RoofGlow later

jsDelivr caches tagged versions permanently, so to publish changes:

1. Upload the changed `roofglow.css` or `roofglow.js` to the GitHub repository.
2. Create a new release with a new tag, for example `1.1.1`.
3. In the Webflow embed, change `@1.1.0` to `@1.1.1` in both URLs and republish.

The HTML in the embed only needs to change if the structure of the tool changes.

## Options

**Navbar offset.** The Preview lights button scrolls to the preview and leaves 90 px at the top for a fixed navbar. To change that, add this to the page's custom code, inside a `<style>` tag:

```css
#roofglow { --rg-scroll-offset: 120px; }
```

**Dark theme.** In the embed, `data-rg-theme="light"` matches a light website. Change it to `"dark"` for a dark version, or `"auto"` to follow each visitor's device setting.

**Page heading.** RoofGlow includes its own `<h1>`, "Measure your roofline". If your Webflow page already has an H1, change RoofGlow's `<h1>` and `</h1>` in the embed to `<h2>` and `</h2>`. Pages should have only one H1.

**Watermark.** The logo and phone number watermark is built in but switched off. To turn it on, open `roofglow.js`, search for `SHOW_WATERMARK = false`, change it to `true`, and publish a new version.

## How conflicts with Webflow are avoided

- Every id and class starts with `rg-`. Your Webflow classes, such as `.card` or `.row`, can't accidentally style RoofGlow, and RoofGlow can't style your site.
- Every CSS rule is scoped under `#roofglow`, with a reset that neutralizes Webflow's default heading, label, input, button, and image styles inside the tool.
- The JavaScript runs inside its own function. It doesn't use or overwrite jQuery's `$` or any other global.
- Keyboard shortcuts (Enter, Esc, Backspace, Ctrl/Cmd+Z) only work while the tracing photo has focus. They never interfere with the rest of the page.
- The layout responds to the space RoofGlow actually has on the page, not just the screen width, so it fits correctly in containers and columns.
