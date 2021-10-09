module ImageHelper(Image(..), decodeBufferToImage, loadImageFromResources) where

import Prelude

import Control.Monad.Error.Class (throwError)
import Control.Promise (Promise, toAffE)
import Data.Maybe (Maybe(..))
import Data.Symbol (class IsSymbol, SProxy(..))
import Effect (Effect)
import Effect.Aff (Aff, error)
import Effect.Class (liftEffect)
import Node.Buffer (Buffer)
import Node.FS.Aff (readFile)
import Node.Process (cwd)
import Pathy.Name (class IsName)
import Pathy.Parser (parseAbsDir, posixParser)
import Pathy.Path (Path, dir, file, (</>))
import Pathy.Phantom (class IsDirOrFile, class IsRelOrAbs, Abs, Dir, File, Rel)
import Pathy.Printer (debugPrintPath, posixPrinter)

foreign import decodeBufferToImageImpl :: Buffer -> Effect (Promise Image)

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

decodeBufferToImage :: Buffer -> Aff Image
decodeBufferToImage = toAffE <<< decodeBufferToImageImpl

loadImageFromResources :: forall s. IsSymbol s => IsName s => SProxy s -> Aff Image
loadImageFromResources name = do
  imgPath <- getImagePathFromName name
  binaryBuffer <- readFile (printTestPath imgPath)
  decodeBufferToImage binaryBuffer

addRoot :: Path Abs Dir -> Path Abs Dir
addRoot root = root </> relativeResourcesDir

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