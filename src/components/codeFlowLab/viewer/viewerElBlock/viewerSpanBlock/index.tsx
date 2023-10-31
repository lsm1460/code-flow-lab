import { ChartSpanItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import _ from 'lodash';
import { CSSProperties, RefObject, useMemo } from 'react';

interface SpanViewerItem extends ViewerItem {
  text?: ChartSpanItem['text'];
}

interface Props {
  elRef: RefObject<HTMLSpanElement>;
  viewerItem: SpanViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
}
function ViewerSpanBlock({ elRef, viewerItem, triggerProps, variables, addedStyle }: Props) {
  const textVariable = useMemo(
    () => variables[viewerItem.connectionVariables[0]?.connectParentId],
    [variables, viewerItem]
  );

  return (
    <span ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {_.isUndefined(textVariable) ? viewerItem.text : textVariable}
    </span>
  );
}

export default ViewerSpanBlock;
