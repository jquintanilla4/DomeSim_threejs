# Fisheye Dome Simulation

This project is a web application that plays videos within a 3D hemispherical dome using Three.js. It allows users to input a video URL and adjust UV scaling for fisheye projection effects.

## Features

*   Plays video on a 3D hemisphere (dome).
*   Customizable video source URL via an input field.
*   Adjustable UV scaling for fisheye projection effects.
*   Interactive controls: Play, Pause, Stop.
*   Toggle between inside and outside views of the dome.
*   Rotation controls for the inside view.
*   Minimap for orientation when inside the dome.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (version 18.x or 20.x or newer recommended, includes npm)

## Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd dome_threejs
    ```

2.  **Install dependencies:**
    Open your terminal in the project's root directory (`dome_threejs`) and run:
    ```bash
    npm install
    ```
    This will download and install all the necessary packages defined in `package.json` (like Three.js and Vite).

## Running the Project

To start the development server and view the application in your browser:

1.  In your terminal, from the project's root directory, run:
    ```bash
    npm run dev
    ```
2.  Vite will start a local development server and usually print the local URL to the console (e.g., `http://localhost:5173`).
3.  Open this URL in your web browser.

## Using the Application

*   **Video URL:** Enter the URL of the video you want to play in the "Video URL" input field.
*   **UV Scale:** Adjust the fisheye projection by entering a numeric value in the "UV Scale" input field.
*   Click the **"Apply Settings"** button to load the video and apply the scale.
*   Use the **Play/Pause/Stop** buttons to control video playback.
*   Use the **"Outside View" / "Inside View"** button to toggle the camera perspective.
*   When in "Inside View", use the **rotation buttons** to look around the dome.

## Example Videos

This repository includes two example videos located in the `public/fisheye/` directory. To use them:

1.  Ensure the application is running (`npm run dev`).
2.  Enter one of the following paths into the "Video URL" input field:
    *   `fisheye/shot01_02.mp4`
    *   `fisheye/shot03_04_fishconv.mp4` (This video is pre-converted to a fisheye format. For optimal viewing, you might try a "UV Scale" of `0.5`, especially if it was converted using the parameters mentioned in the tips below.)
3.  Click the "Apply Settings" button.

## Tips for UV Scaling

*   If you have converted a 1:1 aspect ratio flat video to a fisheye format using ffmpeg with the following parameters:
    *   Input Horizontal FOV: 90°
    *   Input Vertical FOV: 90°
    *   Output Horizontal FOV: 180°
    *   Output Vertical FOV: 180°
    Then, the recommended **UV Scale** value to enter in this application is `0.5` for correct projection onto the dome.

## Placing Video Files

To use local video files, you should place them in a `public` directory in the root of your project.

1.  **Create a `public` directory** in the root of your `dome_threejs` project if it doesn't already exist.
    ```
    dome_threejs/
    ├── public/
    │   └── your_video.mp4
    ├── src/
    │   └── main.js
    ├── index.html
    ├── package.json
    └── ... (other files)
    ```
2.  Place your video files (e.g., `my_awesome_video.mp4`) inside this `public` directory.
3.  When the development server (`npm run dev`) is running, these files will be served from the root path. So, in the "Video URL" input field in the application, you would enter the filename directly (e.g., `my_awesome_video.mp4`) or a path relative to the `public` folder if you create subdirectories within it (e.g., `videos/my_awesome_video.mp4`).

    **Example:** If you place `cool_video.mp4` into the `public` folder, you would enter `cool_video.mp4` into the video URL input.

## Building for Production

To create an optimized build of the application for deployment:

```bash
npm run build
```
This will create a `dist` folder with the static assets for your application.

To preview the production build locally:

```bash
npm run preview
```
