import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

export default {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCANNER_SIZE,
};