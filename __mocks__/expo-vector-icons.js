const React = require('react');
const { View } = require('react-native');

const MockIcon = (props) => React.createElement(View, { testID: props.name || 'icon', ...props });

module.exports = {
  Ionicons: MockIcon,
  MaterialIcons: MockIcon,
  FontAwesome: MockIcon,
  FontAwesome5: MockIcon,
  AntDesign: MockIcon,
  Entypo: MockIcon,
  EvilIcons: MockIcon,
  Feather: MockIcon,
  Foundation: MockIcon,
  MaterialCommunityIcons: MockIcon,
  Octicons: MockIcon,
  SimpleLineIcons: MockIcon,
  Zocial: MockIcon,
  default: MockIcon,
};
