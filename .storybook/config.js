import { configure } from '@storybook/react';

function loadStories() {
    require('../stories/Task.stories.jsx');
    require('../stories/Op.stories.jsx');
    require('../stories/Delay.stories.jsx');
}

configure(loadStories, module);
