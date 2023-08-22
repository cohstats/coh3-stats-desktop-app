import React from "react"

export interface HTMLProps {
  html: string
}

/**
 * You cannot use mantine here!
 * This React component is meant for the streamerOverlay where only inline styles work!
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
        <title>COH3 Stats Desktop App Overlay</title>
        <style>
          {`
                        .coh3stats-overlay {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: flex-start;
                            align-items: stretch;
                            position: absolute;
                            left: calc((100vw / 2) - 485px);
                            right: calc((100vw / 2) - 485px);
                            top: 65px;
                        }

                        .coh3stats-overlay-left {
                            flex-grow: 1;
                            flex-basis: 0;
                            padding-right: 40px;
                            padding-left: 10px;
                        }

                        .coh3stats-overlay-right {
                            flex-grow: 1;
                            flex-basis: 0;
                            padding-left: 40px;
                            padding-right: 10px;
                        }

                        .coh3stats-overlay-player {
                          color: white;
                          font-size: 20px;
                          font-family: Tilt Warp;
                        }

                        .coh3stats-overlay-player-factionIcon {
                          padding-right: 10px;
                          width: 25px;
                          height: 25px;
                        }

                        .coh3stats-overlay-player-flagIcon {
                          padding-right: 10px;
                          width: 25px;
                          height: 25px;
                        }

                        .coh3stats-overlay-player-rank {
                          padding-right: 10px;
                          min-width: 4ch;
                          display: inline-block;
                          text-align: center;
                        }

                        .coh3stats-overlay-player-rating {
                          padding-right: 10px;
                          min-width: 4ch;
                          display: inline-block;
                          text-align: center;
                        }

                        .coh3stats-overlay-player-name {
                          max-width: 17ch;
                          display: inline-block;
                          text-overflow: ellipsis;
                          overflow: hidden;
                          white-space: nowrap;
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
