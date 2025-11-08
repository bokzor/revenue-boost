import React from "react";
import type { BasePopupProps } from "./BasePopup";
import { BasePopup } from "./BasePopup";

export interface ModalPopupProps extends Omit<BasePopupProps, "className"> {
  animation?: "fade" | "scale" | "slideDown";
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
  animation = "scale",
  ...props
}) => {
  const getAnimationClass = () => {
    switch (animation) {
      case "fade":
        return "popup-fade";
      case "slideDown":
        return "popup-slide-down";
      default:
        return "popup-scale";
    }
  };

  return (
    <>
      <BasePopup {...props} className={`modal-popup ${getAnimationClass()}`} />
      <style>{`
        .modal-popup {
          animation-duration: 0.3s;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }

        .popup-fade {
          animation-name: popupFadeIn;
        }

        .popup-scale {
          animation-name: popupScaleIn;
        }

        .popup-slide-down {
          animation-name: popupSlideDown;
        }

        @keyframes popupFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes popupScaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes popupSlideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
