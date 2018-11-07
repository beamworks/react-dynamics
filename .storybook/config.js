import { configure } from '@storybook/react';

function loadStories() {
    require('../stories/Sequence.stories.jsx');
    require('../stories/Op.stories.jsx');
    require('../stories/Timeout.stories.jsx');
}

configure(loadStories, module);
