
import {FormattedMessage} from 'react-intl';
import React from 'react';
//robot teachable
import robotteachableImage from '../robotteachable/teachable_center.png'
const robotCustomExtension =  {
    name: (
        <FormattedMessage
            defaultMessage="机器学习"
            description="Name for the 'robotteachable' extension"
            id="gui.extension.robotteachable.name"
        />
    ),
    extensionId: 'robotteachable',
    iconURL: robotteachableImage, 
    // insetIconURL: robotteachableInsetImage,
    description: (
        <FormattedMessage
            defaultMessage="机器学习."
            description="Description for the 'robotteachable' extension"
            id="gui.extension.robotteachable.description"
        />
    ),
    // generator:'./helloworld/generator.js',
    tags: ['scratch'],
    featured: true
};

export default robotCustomExtension