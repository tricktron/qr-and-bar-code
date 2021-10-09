module Test.Main where

import Prelude

import Data.Either (Either(..))
import Data.String (replace)
import Data.String.Pattern (Pattern(..), Replacement(..))
import Data.Symbol (SProxy(..))
import Effect (Effect)
import Effect.Aff (launchAff_)
import Effect.Class (liftEffect)
import ImageHelper (Image(..), decodeBufferToImage, loadImageFromResources)
import Node.Buffer (create, fromString)
import Node.Encoding (Encoding(..))
import QrReader (Code(..), scanQrCode, scanBarcode, createBase64PNGQrCode)
import Test.Spec (describe, it)
import Test.Spec.Assertions (shouldEqual)
import Test.Spec.Reporter.Console (consoleReporter)
import Test.Spec.Runner (runSpec)

main :: Effect Unit
main = launchAff_ $ runSpec [consoleReporter] do
  describe "Given local ean13 png file" do
    let ean13ImageAff = loadImageFromResources (SProxy :: SProxy "ean13-barcode.png")
    it "then can decode it to image" do
      img <- ean13ImageAff
      mockBuf <- liftEffect $ create 42
      let expectedImage = Image { width: 492.0, height: 179.0, rgbaPixels: mockBuf }
      img `shouldEqual` expectedImage
    it "then can extract barcode text" do
      let expectedEan13 = Right $ Barcode "1234567890128"
      Image img <- ean13ImageAff
      let ean13 = scanBarcode img.rgbaPixels img.width img.height
      ean13 `shouldEqual` expectedEan13
  describe "Given local qrcode png file" do
    it "then can extract qr code data" do
      Image img <- loadImageFromResources (SProxy :: SProxy "qr-code.png")
      mockBuf <- liftEffect $ create 42
      let expectedQrCode = Right $ QrCode { text: "http://www.google.com/", dataBuffer: mockBuf }
      let qrCode = scanQrCode img.rgbaPixels img.width img.height
      qrCode `shouldEqual` expectedQrCode
    it "then can convert QR data to base64 png string" do
      let base64PNGQrCodeImage = createBase64PNGQrCode "http://www.google.com/" 300
      base64PNGQrCodeImage `shouldEqual` "data:image/png;base64,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"
      let base64String = replace (Pattern "data:image/png;base64,") (Replacement "") base64PNGQrCodeImage
      buffer <- liftEffect $ fromString base64String Base64
      Image img <- decodeBufferToImage buffer
      img.height `shouldEqual` 300.0
      img.width `shouldEqual` 300.0
  describe "Given png file without QR code" do
    it "then it handles exception correctly" do
      let expectedFailedQrCode = Left "QR code could not be read"
      Image img <- loadImageFromResources (SProxy :: SProxy "no-code.png")
      let failedCode = scanQrCode img.rgbaPixels img.width img.height
      failedCode `shouldEqual` expectedFailedQrCode



