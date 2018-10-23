import { configure } from '@storybook/react';

function loadStories() {
    require('../stories/Timeout.stories.jsx');
}

configure(loadStories, module);
