# Beyond Listening — start here

This folder contains the whole Beyond Listening website. It runs **on your own computer**. Nothing is published online, no email is really sent, and it costs nothing.

---

## 1. One-time setup: install Docker Desktop (about 10 minutes)

Docker Desktop runs the site's database on your computer. It's free for personal use.

1. Go to **https://www.docker.com/products/docker-desktop/** and download it:
   - **Mac:** pick **"Apple Silicon"** if your Mac has an M1/M2/M3/M4 chip (Apple menu → About This Mac), otherwise **"Intel Chip"**.
   - **Windows:** pick **"Windows – AMD64"**. If the installer asks about **WSL 2**, keep it selected. Windows may ask you to restart.
2. Open **Docker Desktop** once. Accept the terms. You can skip signing in or creating an account.
3. Wait until the bottom-left corner says **"Engine running"**. You can then close the Docker window. It keeps running in the background.

You don't need to install anything else. The start button downloads everything else it needs into this folder.

---

## 2. Start the site

### On a Mac
1. Double-click **`Start Beyond Listening.command`**.
2. **The first time only**, macOS may say it "cannot verify the developer". Then:
   - open **System Settings → Privacy & Security**, scroll down and click **"Open Anyway"** next to *Start Beyond Listening*, then confirm; **or**
   - right-click the file → **Open** → **Open**.
3. A Terminal window opens and shows the progress.

> **If double-clicking doesn't work at all** (e.g. "you don't have permission"): open the **Terminal** app, type `bash ` (with a space at the end), drag the `Start Beyond Listening.command` file into the Terminal window, and press Enter.

### On Windows
1. Double-click **`Start Beyond Listening.bat`**.
2. If Windows shows **"Windows protected your PC"**, click **More info → Run anyway**.
3. A black window opens and shows the progress.

### What happens next
- **The first start takes 5–20 minutes**, depending on your internet speed. It downloads the database (about 1–2 GB) and prepares the site.
- **Later starts take less than a minute.**
- When it's ready, your browser opens **http://localhost:3000** automatically.

**Keep the start window open while you use the site.** Closing it turns the site off.

---

## 3. Useful addresses (while the site is running)

| What | Address |
|---|---|
| The website | http://localhost:3000 |
| Admin area | http://localhost:3000/admin |
| **Local inbox**: every email the site "sends" (login links, verification emails…) lands here instead of being sent | http://127.0.0.1:54324 |
| Styleguide (for the designer) | http://localhost:3000/styleguide |

### Logging in to the admin area
1. Go to **http://localhost:3000/admin**.
2. Enter **admin@beyond-listening.local** and press **Send me a login link**.
3. Open the **local inbox** (http://127.0.0.1:54324), open the newest email, and click the link. You're in. The login lasts for weeks on the same browser.

From the admin area you can:
- **Review** new stories: approve, or decline with a kind note to the author.
- Build **Sessions** (playlists from your listening evenings). This works on a phone, including recording people's stories.
- Handle **Reports**.
- Edit **Songs**, **Themes** and **Reactions**.
- **Download everything** as a ZIP from Settings.

---

## 4. Stop the site

- **Just close the start window** to turn the website off.
- To also stop the database and free up memory, double-click **`Stop Beyond Listening`** (`.command` on Mac, `.bat` on Windows).

**Your stories and recordings are kept.** Everything is still there next time you start.

---

## 5. Backups (do this regularly)

While the site is running, double-click **`Back Up Beyond Listening`** (`.command` on Mac, `.bat` on Windows).
- It saves everything into the **`backups`** folder, in a new subfolder named with the date and time: all stories, songs, sessions, settings and voice recordings.
- **Copy that folder somewhere else** too (a USB stick, an external disk). It contains contributors' emails and voices, so keep it private.
- **To restore a backup**, ask the developer. It's one command (`npm run restore -- <folder name>`), and it replaces the current data.

The admin area also has **Settings → Download everything (ZIP)**, which saves a copy that can be opened anywhere.

---

## 6. What happens with the data?

| Data | Where it is stored | Does it leave your computer? |
|---|---|---|
| Stories, recordings, transcripts, pseudonyms, emails, playlists | In the local database managed by Docker on this computer | **No** |
| Emails the site "sends" | The local inbox (see above). Nothing is really sent | **No** |
| Turning a voice recording into text | Done inside your browser | **No** |
| Song searches (e.g. "Bohemian Rhapsody") | Sent to Deezer / Apple iTunes / MusicBrainz to find the song | Only the search words (like any web search) |
| 30-second song previews and album covers | Played directly from Deezer/Apple, never saved | They're streamed, not stored |
| Speech-to-text model | Downloaded once from Hugging Face into your browser | Download only |

- **The data is deleted only if** you uninstall Docker Desktop, or if a developer runs a reset command on purpose.
- **Please use made-up stories while testing.** If you try it with friends' real stories, tell them it's a test.

---

## 7. If something goes wrong

- Read the message in the start window. It explains what to do in plain words.
- **"Docker Desktop needs to be installed first"**: do step 1, then start again.
- **"Docker Desktop did not start"**: open Docker Desktop yourself, wait for "Engine running", then start again.
- **"Is another program using port 3000?"**: close other development tools, or restart the computer, then start again.
- **Still stuck?** Send the developer the file **`.runtime/launcher.log`** from this folder.
  - **Mac:** the folder is hidden. Press **Cmd + Shift + .** in Finder to show it.

---

## 8. Putting it online

That's a later step, once the prototype has been tried and approved. The guide is in **`GOING_ONLINE.md`**.
