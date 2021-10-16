module QrReader(Image(..), scanBarcode, Code(..), createBase64PNGQrCode, decodeBase64PngImageUri, scanQrCodeEff) where

import Prelude

import Data.ArrayBuffer.Types (ArrayBuffer)
import Data.Bifunctor (bimap)
import Data.Either (Either(..))
import Data.String (replace)
import Data.String.Pattern (Pattern(..), Replacement(..))
import Effect (Effect)
import Effect.Exception (message, try)
import Node.Buffer (Buffer)

foreign import scanBarcodeImpl :: forall a b. (a -> Either a b) -> (a -> Either a b) -> (String -> Code) -> Buffer -> Number -> Number -> Either String Code
foreign import scanQrCodeEffImpl :: Image -> Effect String
foreign import createBase64PNGQrCodeImpl :: String -> Int -> String
foreign import decodePngImpl :: ArrayBuffer -> Image
foreign import convertBase64StringToArrayBufferImpl :: String -> ArrayBuffer

data Code = QrCode String | Barcode String

instance eqCode :: Eq Code where
  eq :: Code -> Code -> Boolean
  eq (Barcode b1) (Barcode b2) = b1 == b2
  eq (QrCode qr1) (QrCode qr2) = qr1 == qr2
  eq _ _ = false

instance showCode :: Show Code where
  show :: Code -> String
  show (Barcode b) = "Barcode { " <> b <> " }"
  show (QrCode qr) = "QrCode { " <> qr <> " }"

newtype Image = Image {
    width :: Number,
    height :: Number,
    rgbaPixels :: Buffer
}

instance showImage :: Show Image where
  show :: Image -> String
  show (Image { width, height }) = "{ width: " <> show width <> ", height: " <> show height <> " }"

instance eqImage :: Eq Image where
  eq :: Image -> Image -> Boolean
  eq (Image img1) (Image img2) = img1.width == img2.width && img1.height == img2.height

scanBarcode :: Buffer -> Number -> Number -> Either String Code
scanBarcode rgbaBuffer width height = scanBarcodeImpl Left Right Barcode rgbaBuffer width height

createBase64PNGQrCode :: String -> Int -> String
createBase64PNGQrCode = createBase64PNGQrCodeImpl

decodeBase64PngImageUri :: String -> Effect Image
decodeBase64PngImageUri s = do
  let base64String = replace (Pattern "data:image/png;base64,") (Replacement "") s
  let arrayBuf = convertBase64StringToArrayBuffer base64String
  pure $ decodePngImpl arrayBuf

scanQrCodeEff :: String -> Effect (Either String Code)
scanQrCodeEff s = do
  img <- decodeBase64PngImageUri s
  eitherCode <- try $ scanQrCodeEffImpl img
  pure $ bimap (\err -> message err) QrCode eitherCode

convertBase64StringToArrayBuffer :: String -> ArrayBuffer
convertBase64StringToArrayBuffer = convertBase64StringToArrayBufferImpl