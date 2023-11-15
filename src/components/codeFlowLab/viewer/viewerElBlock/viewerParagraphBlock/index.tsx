import { TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import ViewerElBlock from '..';

interface Props {
  elRef: RefObject<HTMLParagraphElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
  mapItem;
}
function ViewerParagraphBlock({ elRef, viewerItem, triggerProps, variables, addedStyle, mapItem }: Props) {
  return (
    <p ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} variables={variables} mapItem={mapItem} />
      ))}
    </p>
  );
}

export default ViewerParagraphBlock;
