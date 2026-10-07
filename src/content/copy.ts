/**
 * All interface wording lives here, so it can be edited without touching
 * components. English only.
 */
export const copy = {
  site: {
    name: "Beyond Listening",
    tagline: "An archive of personal stories tied to the songs that hold them.",
  },
  nav: {
    archive: "Archive",
    playlists: "Sessions",
    about: "About",
    share: "Share your story",
    skipToContent: "Skip to content",
  },
  hero: {
    question: "What song holds a story for you?",
    intro: "Find the song. Tell us what it holds. Write it down or record it in your own voice.",
    searchPlaceholder: "Search for a song or an artist…",
    searchCta: "Tell your story",
  },
  search: {
    label: "Search songs, artists and stories",
    placeholder: "Search songs, artists, stories",
    beTheFirst: "No stories for this song yet. Be the first to tell one.",
    noResults: "Nothing found. Try another spelling, or just the song title.",
  },
  home: {
    projectHeading: "Why this archive exists",
    featuredHeading: "Stories to start with",
    recentHeading: "Recently shared",
    playlistHeading: "From our latest listening session",
    randomHeading: "Not sure where to start?",
    randomText: "Let chance pick a story for you.",
    randomCta: "Take me to a random story",
    seeAll: "See the whole archive",
  },
  archive: {
    title: "The archive",
    intro: "Every story here was shared by someone about a song that matters to them.",
    empty: "No stories match these filters yet.",
    clear: "Clear filters",
    loadMore: "Show more stories",
    shuffle: "Shuffle",
    reshuffle: "Shuffle again",
  },
  song: {
    tellYours: "Tell your story about this song",
    storiesHeading: "Stories about this song",
    noStories: "No stories about this song yet.",
    relatedHeading: "You might also like",
    preview: "Play 30-second preview",
  },
  story: {
    alsoHaveOne: "Do you have a story about this song too?",
    alsoHaveOneCta: "Tell yours",
    relatedHeading: "More stories like this",
    relatedSongsHeading: "Songs nearby",
    transcript: "Transcript",
    sourceLive: "Told at a live listening session",
    sourcePublic: "Shared by a listener",
    report: "Report this story",
    reactionsLabel: "How did this story make you feel?",
  },
  playlists: {
    title: "Listening sessions",
    intro:
      "We gather with a record player and a few friends. Everyone brings a song and the story it holds. These are the playlists from those evenings.",
    empty: "Our first listening session is coming soon.",
    playAll: "Play all previews",
    removedStory: "This story was removed by its author.",
  },
  footer: {
    note: "Beyond Listening is a small, independent archive. Song previews are provided by Deezer and Apple Music.",
    privacy: "Privacy",
    terms: "Terms",
    license: "Story licence",
    manage: "Manage my story",
  },
  prototype: {
    banner: "Local prototype: everything you see is stored only on this computer.",
  },
} as const;
