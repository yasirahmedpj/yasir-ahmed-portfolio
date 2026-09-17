/* ---------------------------------------------------------------------
   PROJECTS — centralized data file
   Add, remove or edit projects here. The homepage grid and the project
   detail pages (project.html) both render from this single array.

   Optional fields (only rendered on the detail page if filled in):
     description : short paragraph describing the project
     role        : your role on the project (e.g. "Editing, Sound Design")
     tools       : software / tools used — array of strings
     video       : path to a video file (e.g. "public/assets/videos/project.mp4")
                   If empty, the thumbnail image is shown instead.
     source      : optional external link shown on the detail page.
     link        : optional external URL — when set, the homepage card opens
                   it in a new tab instead of the project detail page.
--------------------------------------------------------------------- */

const projectsData = [
    {
        id: 1,
        title: "Maybell",
        category: "Commercial",
        year: "2025",
        thumbnail: "public/assets/images/maybell onam.jpg",
        description: "",
        role: "",
        tools: [],
        video: "",
        source: "",
        link: "https://youtu.be/zsH4T6FFYIU?si=OLWcGDVpr5jodHY1"
    },
    {
        id: 2,
        title: "Reia Diamonds",
        category: "Commercial",
        year: "2025",
        thumbnail: "public/assets/images/reia diamonds.jpg",
        description: "",
        role: "",
        tools: [],
        video: "",
        source: "",
        link: "https://youtu.be/-_8WNRYzYlg"
    },
    {
        id: 3,
        title: "Vaarahi",
        category: "Commercial",
        year: "2026",
        thumbnail: "public/assets/images/vaarahi pongal.jpg",
        description: "",
        role: "",
        tools: [],
        video: "",
        source: "",
        link: "https://youtu.be/5HzFb9sTnFM"
    }
];

/* ---------------------------------------------------------------------
   SHORTFILMS — rendered in the same 3-box grid as Commercials.
   Add, remove or edit entries here. When `link` is filled the card opens
   it in a new tab; leave empty to show a static card. Update `thumbnail`
   as soon as the real posters are ready.
   --------------------------------------------------------------------- */
const shortfilmsData = [
    {
        id: 1,
        title: "Butcher",
        category: "Shortfilm",
        year: "2025",
        thumbnail: "public/assets/images/Butcher Poster 3.jpg",
        link: "https://youtu.be/LIrCAG3qBQY?si=Fvh59iOZADFnKU3W"
    },
    {
        id: 2,
        title: "Sugar Date",
        category: "Shortfilm",
        year: "2025",
        thumbnail: "public/assets/images/Sugar Date Poster 1.jpg",
        link: "https://youtu.be/J3PcuVWlBuQ?si=x9EjqeVhm7dQx3Cr"
    },
    {
        id: 3,
        title: "Yellow Fellow",
        category: "Shortfilm",
        year: "2024",
        thumbnail: "public/assets/images/Yellow Fellow.jpg",
        link: "https://youtu.be/UiRX-lMTpok?si=HtRpeNZXxruV0wg6"
    }
];

/* ---------------------------------------------------------------------
   REELS — vertical 9:16 shorts / reels
   Each reel shows a 9:16 thumbnail in a row of 4. When `link` is filled,
   clicking the reel opens it in a new tab (e.g. YouTube / Instagram).
   Add or remove entries freely to match your count.

   Fill in each entry:
     thumbnail : path to a 9:16 image (e.g. "public/assets/images/reel-1.jpg")
     link      : optional URL — opens in a new tab on click
     title     : optional label shown on hover
--------------------------------------------------------------------- */
const reelsData = [
    {
        thumbnail: "public/assets/images/maybell 1.jpg",
        gdrive: "https://drive.google.com/file/d/1G6pJrvnpP3UTNRAZKbGpBi3VEzih4vVd/view?usp=sharing",
        link: "",
        title: "MAYBELL",
        year: "2026",
        quality: "1080"
    },
    {
        thumbnail: "public/assets/images/jewel reel 2 cvr.JPG",
        gdrive: "https://drive.google.com/file/d/1kd2fOrqYmcEVjH5_WNvqwgpV4BUolFxh/preview?autoplay=1&vq=hd1080&quality=high",
        link: "",
        title: "V&D",
        year: "2026"
    },
    {
        thumbnail: "public/assets/images/jewel reel 3 cvr.JPG",
        gdrive: "https://drive.google.com/file/d/1zfCcwvCWR06dYn9iUUHRCneGaIaQ8QQK/preview?autoplay=1&vq=hd1080&quality=high",
        link: "",
        title: "V&D",
        year: "2026"
    },
    {
        thumbnail: "public/assets/images/yazhi 1.JPG",
        gdrive: "https://drive.google.com/file/d/1XZGAoB0FfbElRzHjJaUzsyWMuezXyFJY/preview?autoplay=1&vq=hd1080&quality=high",
        link: "",
        title: "YAZHI",
        year: "2025",
        quality: "1080"
    },
    {
        thumbnail: "public/assets/images/fuk 1.JPG",
        gdrive: "https://drive.google.com/file/d/1Ob51scB3UvnKG6vZeEeM5mGb8Q2ihQXF/view?usp=sharing",
        link: "",
        title: "FUUKUU",
        year: "2025",
        quality: "1080"
    },
{
        thumbnail: "public/assets/images/wholy 1.JPG",
        gdrive: "https://drive.google.com/file/d/1sHqqH3ZxaGABrmNsVheIQfdOtunW_SLD/view?usp=sharing",
        link: "",
        title: "WHOLY",
        year: "2025",
        quality: "1080"
    },
    {
        thumbnail: "public/assets/images/nano 1.JPG",
        gdrive: "https://drive.google.com/file/d/1W7plm1ZS323oB9C5zia4VCIOOn1cgjQ7/view?usp=sharing",
        link: "",
        title: "NANO BLOGGER",
        year: "2025",
        quality: "1080"
    },
    {
        thumbnail: "public/assets/images/jewl 2.JPG",
        gdrive: "https://drive.google.com/file/d/1cskQo9YqZeT1PvnIzKCyicJxaTjpIuUw/view?usp=sharing",
        link: "",
        title: "JEWEL",
        year: "2025",
        quality: "1080"
    }
];