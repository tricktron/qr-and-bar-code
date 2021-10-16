module ImageHelper(decodeBufferToImage, loadImageFromResources, loadImageFromResourcesAsBase64ImageUri) where

import Prelude

import Control.Monad.Error.Class (throwError)
import Control.Promise (Promise, toAffE)
import Data.Maybe (Maybe(..))
import Data.Symbol (class IsSymbol, SProxy(..))
import Effect (Effect)
import Effect.Aff (Aff, error)
import Effect.Class (liftEffect)
import Node.Buffer (Buffer, toString)
import Node.Encoding (Encoding(..))
import Node.FS.Aff (readFile)
import Node.Process (cwd)
import Pathy.Name (class IsName)
import Pathy.Parser (parseAbsDir, posixParser)
import Pathy.Path (Path, dir, file, (</>))
import Pathy.Phantom (class IsDirOrFile, class IsRelOrAbs, Abs, Dir, File, Rel)
import Pathy.Printer (debugPrintPath, posixPrinter)
import QrReader (Image)

foreign import decodeBufferToImageImpl :: Buffer -> Effect (Promise Image)
foreign import decodeBinaryBufferToPNGBufferImpl :: Buffer -> Effect (Promise Buffer)

decodeBufferToImage :: Buffer -> Aff Image
decodeBufferToImage = toAffE <<< decodeBufferToImageImpl

decodeBinaryBufferToBase64ImageUri :: Buffer -> Aff String
decodeBinaryBufferToBase64ImageUri buf = do
  pngBuf <- toAffE $ decodeBinaryBufferToPNGBufferImpl buf
  liftEffect $ toString Base64 pngBuf

loadImageFromResourcesToBinaryBuffer :: forall s. IsSymbol s => IsName s => SProxy s -> Aff Buffer
loadImageFromResourcesToBinaryBuffer name = do
  imgPath <- getImagePathFromName name
  readFile (printTestPath imgPath)

loadImageFromResourcesAsBase64ImageUri :: forall s. IsSymbol s => IsName s => SProxy s -> Aff String
loadImageFromResourcesAsBase64ImageUri = loadImageFromResourcesToBinaryBuffer >=> decodeBinaryBufferToBase64ImageUri

loadImageFromResources :: forall s. IsSymbol s => IsName s => SProxy s -> Aff Image
loadImageFromResources = loadImageFromResourcesToBinaryBuffer >=> decodeBufferToImage

getImagePathFromName :: forall s. IsSymbol s => IsName s => SProxy s -> Aff (Path Abs File)
getImagePathFromName imageName = do
  here <- currentDirectory
  pure $ here </> relativeResourcesDir </> file imageName

printTestPath :: forall a b. IsRelOrAbs a => IsDirOrFile b => Path a b -> String
printTestPath p = debugPrintPath posixPrinter p

currentDirectory :: Aff (Path Abs Dir)
currentDirectory = do
  here <- liftEffect cwd
  let correctedCurrentDir = here <> "/"
  let maybeDir = parseAbsDir posixParser correctedCurrentDir
  case maybeDir of
    Just p -> pure p
    Nothing -> throwError $ error $ correctedCurrentDir <> " is not a valid directory path"

relativeResourcesDir :: Path Rel Dir
relativeResourcesDir = dir (SProxy :: SProxy "test") </> dir (SProxy :: SProxy "resources")