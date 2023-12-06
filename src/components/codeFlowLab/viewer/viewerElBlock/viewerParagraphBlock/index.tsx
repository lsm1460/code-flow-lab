import { TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { CSSProperties, RefObject } from 'react';
import ViewerElBlock from '..';

interface Props {
  elRef: RefObject<HTMLParagraphElement>;
  viewerItem: ViewerItem;
  triggerProps: TriggerProps;
  addedStyle: CSSProperties;
  mapItem;
  isOnlyViewer: boolean;
}
function ViewerParagraphBlock({ elRef, viewerItem, triggerProps, addedStyle, mapItem, isOnlyViewer }: Props) {
  return (
    <p ref={elRef} style={{ ...viewerItem.styles, ...addedStyle }} {...triggerProps}>
      {viewerItem.children.map((_item) => (
        <ViewerElBlock key={_item.id} viewerItem={_item} mapItem={mapItem} isOnlyViewer={isOnlyViewer} />
      ))}
    </p>
  );
}

export default ViewerParagraphBlock;
