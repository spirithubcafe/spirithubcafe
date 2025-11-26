import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';

export function render(url: string) {
  const html = ReactDOMServer.renderToString(
    React.createElement(StaticRouter, { location: url },
      React.createElement(App)
    )
  );
  return { html };
}
