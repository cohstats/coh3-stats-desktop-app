import React from "react"

export interface HTMLProps {
  html: string
}

/**
 * You cannot use mantine here!
 * This react component is meant for the streamerOverlay where only inline styles work!
 */
export const HTML: React.FC<HTMLProps> = ({ html }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="refresh" content="2" />
        <link
          rel="icon"
          type="image/png"
          href="https://raw.githubusercontent.com/cohstats/coh3-stats-desktop-app/master/public/ms-icon-310x310.png"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Tilt+Warp&display=swap"
          rel="stylesheet"
        />
        <title>Coh3 Stats Desktop App Overlay</title>
        <style>
          {`
                        html {
                            font-family: 'Tilt Warp', cursive;
                        }
                    `}
        </style>
      </head>
      <body>
        <div id="app" dangerouslySetInnerHTML={{ __html: html }} />
      </body>
    </html>
  )
}

/*
                            background: url(https://i.ytimg.com/vi/NVqOvsHxqFc/maxresdefault.jpg) no-repeat center center fixed; 
                            -webkit-background-size: cover;
                            -moz-background-size: cover;
                            -o-background-size: cover;
                            background-size: cover;
*/
