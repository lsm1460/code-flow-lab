import { ChartItemType } from '../types/codeFlowLab';

export const CHART_ELEMENT_ITEMS = [
  ChartItemType.body,
  ChartItemType.div,
  ChartItemType.paragraph,
  ChartItemType.span,
  ChartItemType.button,
  ChartItemType.image,
  ChartItemType.link,
  ChartItemType.input,
  ChartItemType.list,
  ChartItemType.listEl,
  ChartItemType.ifEl,
];

export const CHART_SCRIPT_ITEMS = [
  ChartItemType.function,
  ChartItemType.console,
  ChartItemType.loop,
  // ChartItemType.variable,
  ChartItemType.if,
  ChartItemType.changeValue,
  ChartItemType.addStyle,
  ChartItemType.removeStyle,
  ChartItemType.toggleStyle,
  ChartItemType.moveScene,
  ChartItemType.moveNextScene,
  ChartItemType.movePrevScene,
];

export const CHART_VARIABLE_ITEMS = [
  ChartItemType.variable,
  ChartItemType.array,
  ChartItemType.condition,
  ChartItemType.size,
  ChartItemType.includes,
  ChartItemType.indexOf,
  ChartItemType.get,
  ChartItemType.sceneOrder,
  ChartItemType.calculator,
];

export const CHART_TEXT_ITEMS = [ChartItemType.span, ChartItemType.listEl];

export const FLOW_CHART_ITEMS_STYLE: {
  [_key in ChartItemType]: {
    width: number;
    connectionTypeList: {
      right?: ChartItemType[];
      left?: ChartItemType[];
    };
  };
} = {
  [ChartItemType.body]: {
    width: 200,
    connectionTypeList: {
      right: [ChartItemType.el, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.button]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.span, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.div]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.el, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.list]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.el, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.listEl]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el, ChartItemType.variable],
      right: [ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.paragraph]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.span, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.span]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.note]: {
    width: 200,
    connectionTypeList: {
      left: [],
      right: [],
    },
  },
  [ChartItemType.el]: {
    //dummy
    width: 0,
    connectionTypeList: {
      left: [],
      right: [],
    },
  },
  [ChartItemType.image]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.style]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el, ChartItemType.style, ChartItemType.addStyle],
      right: [ChartItemType.style],
    },
  },
  [ChartItemType.trigger]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.function],
    },
  },
  [ChartItemType.script]: {
    //dummy
    width: 0,
    connectionTypeList: {
      left: [],
      right: [],
    },
  },
  [ChartItemType.function]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.trigger, ChartItemType.function],
      right: [ChartItemType.script],
    },
  },
  [ChartItemType.console]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.loop]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [ChartItemType.function],
    },
  },
  [ChartItemType.variable]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.array]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.if]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.condition]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.size]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.includes]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.indexOf]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.get]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.changeValue]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.addStyle]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [ChartItemType.style],
    },
  },
  [ChartItemType.removeStyle]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [ChartItemType.style],
    },
  },
  [ChartItemType.toggleStyle]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [ChartItemType.style],
    },
  },
  [ChartItemType.moveScene]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.moveNextScene]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.movePrevScene]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.function],
      right: [],
    },
  },
  [ChartItemType.sceneOrder]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.link]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.span, ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.input]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.style, ChartItemType.trigger],
    },
  },
  [ChartItemType.ifEl]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [ChartItemType.el],
    },
  },
  [ChartItemType.calculator]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.variable],
      right: [],
    },
  },
  [ChartItemType.group]: {
    width: 200,
    connectionTypeList: {
      left: [ChartItemType.el],
      right: [],
    },
  },
};

export const FLOW_ITEM_DEFAULT_INFO = {
  id: '',
  name: '',
  elType: '',
  pos: { left: 0, top: 0 },
  zIndex: 0,
  connectionIds: {},
};

export const FLOW_ITEM_ADDITIONAL_INFO = {
  [ChartItemType.style]: {
    styles: {
      display: 'block',
    },
  },
  [ChartItemType.trigger]: {
    triggerType: 'click',
  },
  [ChartItemType.span]: {
    text: '',
    connectionVariables: [],
  },
  [ChartItemType.console]: {
    text: '',
    connectionVariables: [],
  },
  [ChartItemType.loop]: {
    loop: {
      start: 0,
      end: 3,
      increase: 1,
    },
    functionId: '',
    connectionVariables: [],
  },
  [ChartItemType.variable]: {
    var: '',
    sceneId: '',
  },
  [ChartItemType.array]: {
    list: [],
    sceneId: '',
  },
  [ChartItemType.if]: {
    connectionVariables: [],
    conditions: {},
  },
  [ChartItemType.condition]: {
    textList: ['', ''],
    connectionVariables: [],
    operator: '==',
  },
  [ChartItemType.size]: {
    connectionVariables: [],
    text: '',
  },
  [ChartItemType.get]: {
    connectionVariables: [],
    text: 0,
  },
  [ChartItemType.includes]: {
    connectionVariables: [],
    text: '',
  },
  [ChartItemType.indexOf]: {
    connectionVariables: [],
    text: '',
  },
  [ChartItemType.addStyle]: {
    elId: '',
  },
  [ChartItemType.removeStyle]: {
    elId: '',
  },
  [ChartItemType.toggleStyle]: {
    elId: '',
  },
  [ChartItemType.changeValue]: {
    connectionVariables: [],
    operator: '=',
    isNumber: false,
    text: '',
    varId: '',
  },
  [ChartItemType.moveScene]: {
    connectionVariables: [],
    sceneOrder: 0,
  },
  [ChartItemType.link]: {
    link: '',
  },
  [ChartItemType.input]: {
    connectionVariables: [],
    placeholder: '',
    text: '',
  },
  [ChartItemType.image]: {
    src: '',
  },
  [ChartItemType.list]: {
    connectionVariables: [],
    size: 2,
    useIndex: true,
  },
  [ChartItemType.listEl]: {
    elId: '',
  },
  [ChartItemType.ifEl]: {
    connectionVariables: [],
  },
  [ChartItemType.calculator]: {
    textList: ['', ''],
    connectionVariables: [],
    operator: '+',
  },
  [ChartItemType.group]: {
    rootId: '',
  },
  [ChartItemType.note]: {
    text: '',
    size: {
      width: 200,
      height: 100,
    },
  },
};

export const CONNECT_POINT_START = 15;
export const CONNECT_POINT_SIZE = 15;
export const CONNECT_POINT_GAP = 4;
export const BLOCK_HEADER_SIZE = 30;
export const POINT_LIST_PADDING = 0;

export const CUSTOM_TRIGGER_TYPE = ['load', 'visible', 'invisible' /* TODO: 'collision'*/];
export const TRIGGER_TYPE = [
  'click',
  'mouseup',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  ...CUSTOM_TRIGGER_TYPE,
];

export const ZOOM_AREA_ELEMENT_ID = 'flowZoomArea';
export const SCROLL_CLASS_PREFIX = 'property-scroll';
export const CONNECT_POINT_CLASS = 'connect-draw-point';

export const ROOT_BLOCK_ID = 'root';
