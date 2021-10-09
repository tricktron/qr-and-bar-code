module QrReader(scanBarcode, scanQrCode, Code(..), createBase64PNGQrCode) where

import Prelude

import Data.Either (Either(..))
import Node.Buffer (Buffer)

foreign import scanBarcodeImpl :: forall a b. (a -> Either a b) -> (a -> Either a b) -> (String -> Code) -> Buffer -> Number -> Number -> Either String Code
foreign import scanQrCodeImpl :: forall a b. (a -> Either a b) -> (a -> Either a b) -> (String -> Code) -> Buffer -> Number -> Number -> Either String Code
foreign import createBase64PNGQrCodeImpl :: String -> Int -> String

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

scanBarcode :: Buffer -> Number -> Number -> Either String Code
scanBarcode rgbaBuffer width height = scanBarcodeImpl Left Right Barcode rgbaBuffer width height

scanQrCode :: Buffer -> Number -> Number -> Either String Code
scanQrCode rgbaBuffer width height = scanQrCodeImpl Left Right QrCode rgbaBuffer width height

createBase64PNGQrCode :: String -> Int -> String
createBase64PNGQrCode = createBase64PNGQrCodeImpl
