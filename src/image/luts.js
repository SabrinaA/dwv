/**
 * @namespace Image related.
 */
dwv.image = dwv.image || {};
/**
 * @namespace LookUp Table (LUT) related.
 */
dwv.image.lut = dwv.image.lut || {};

/**
 * @class Rescale LUT class.
 * @returns {Rescale}
 */
dwv.image.lut.Rescale = function(slope_,intercept_)
{
    // The internal array.
    var rescaleLut_ = null;
    // The rescale slope.
    if(typeof(slope_) === 'undefined') slope_ = 1;
    // The rescale intercept.
    if(typeof(intercept_) === 'undefined') intercept_ = 0;
    
    // Get the rescale slope.
    this.getSlope = function() { return slope_; };
    // Get the rescale intercept.
    this.getIntercept = function() { return intercept_; };
    // Initialise the LUT.
    this.initialise = function(size)
    {
        if(typeof(size) === 'undefined') size = 4096;
        rescaleLut_ = new Float32Array(size);
        for(var i=0; i<size; ++i)
            rescaleLut_[i] = i * slope_ + intercept_;
    };
    // Get the length of the LUT array.
    this.getLength = function() { return rescaleLut_.length; };
    // Get the value of the LUT at the given offset.
    this.getValue = function(offset) { return rescaleLut_[offset]; };
};

/**
 * @class Window LUT class.
 * @returns {Window}
 */
dwv.image.lut.Window = function(rescaleLut_, isSigned_)
{
    // The internal array: Uint8ClampedArray clamps between 0 and 255.
    // (not supported on travis yet... using basic array, be sure not to overflow!)
    var windowLut_ = null;
    if( !window.Uint8ClampedArray ) {
        console.warn("No support for Uint8ClampedArray.");
        windowLut_ = new Uint8Array(rescaleLut_.getLength());
    }
    else windowLut_ = new Uint8ClampedArray(rescaleLut_.getLength());
    // The window center.
    var center_ = null;
    // The window width.
    var width_ = null;
    
    // Get the center.
    this.getCenter = function() { return center_; };
    // Get the width.
    this.getWidth = function() { return width_; };
    // Get the signed flag.
    this.isSigned = function() { return isSigned_; };
    // Set the window center and width.
    this.setCenterAndWidth = function(center, width)
    {
        // store the window values
        center_ = center;
        width_ = width;
        // pre calculate loop values
        var size = windowLut_.length;
        var center0 = isSigned_ ? center - 0.5 + size / 2 : center - 0.5;
        var width0 = width - 1;
        // Uint8ClampedArray clamps between 0 and 255
        var dispval = 0;
        for(var i=0; i<size; ++i)
        {
            // from the DICOM specification (https://www.dabsoft.ch/dicom/3/C.11.2.1.2/)
            // y = ((x - (c - 0.5)) / (w-1) + 0.5) * (ymax - ymin )+ ymin
            dispval = ((rescaleLut_.getValue(i) - center0 ) / width0 + 0.5) * 255;
            windowLut_[i]= parseInt(dispval, 10);
        }
    };
    // Get the length of the LUT array.
    this.getLength = function() { return windowLut_.length; };
    // Get the value of the LUT at the given offset.
    this.getValue = function(offset)
    {
        var shift = isSigned_ ? windowLut_.length / 2 : 0;
        return windowLut_[offset+shift];
    };

};

/**
* Lookup tables for image color display. 
*/

dwv.image.lut.range_max = 256;

dwv.image.lut.buildLut = function(func)
{
    var lut = [];
    for( var i=0; i<dwv.image.lut.range_max; ++i )
        lut.push(func(i));
    return lut;
};

dwv.image.lut.max = function(i)
{
    return dwv.image.lut.range_max-1;
};

dwv.image.lut.maxFirstThird = function(i)
{
    if( i < dwv.image.lut.range_max/3 )
        return dwv.image.lut.range_max-1;
    return 0;
};

dwv.image.lut.maxSecondThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    if( i >= third && i < 2*third )
        return dwv.image.lut.range_max-1;
    return 0;
};

dwv.image.lut.maxThirdThird = function(i)
{
    if( i >= 2*dwv.image.lut.range_max/3 )
        return dwv.image.lut.range_max-1;
    return 0;
};

dwv.image.lut.toMaxFirstThird = function(i)
{
    var val = i * 3;
    if( val > dwv.image.lut.range_max-1 )
        return dwv.image.lut.range_max-1;
    return val;
};

dwv.image.lut.toMaxSecondThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    var val = 0;
    if( i >= third ) {
        val = (i-third) * 3;
        if( val > dwv.image.lut.range_max-1 )
            return dwv.image.lut.range_max-1;
    }
    return val;
};

dwv.image.lut.toMaxThirdThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    var val = 0;
    if( i >= 2*third ) {
        val = (i-2*third) * 3;
        if( val > dwv.image.lut.range_max-1 )
            return dwv.image.lut.range_max-1;
    }
    return val;
};

dwv.image.lut.zero = function(i)
{
    return 0;
};

dwv.image.lut.id = function(i)
{
    return i;
};

dwv.image.lut.invId = function(i)
{
    return (dwv.image.lut.range_max-1)-i;
};

// plain
dwv.image.lut.plain = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.id),
   "green": dwv.image.lut.buildLut(dwv.image.lut.id),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.id)
};

// inverse plain
dwv.image.lut.invPlain = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.invId),
   "green": dwv.image.lut.buildLut(dwv.image.lut.invId),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.invId)
};

//rainbow 
dwv.image.lut.rainbow = {
   "blue":  [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 252, 255, 247, 239, 231, 223, 215, 207, 199, 191, 183, 175, 167, 159, 151, 143, 135, 127, 119, 111, 103, 95, 87, 79, 71, 63, 55, 47, 39, 31, 23, 15, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
   "green": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 253, 251, 249, 247, 245, 243, 241, 239, 237, 235, 233, 231, 229, 227, 225, 223, 221, 219, 217, 215, 213, 211, 209, 207, 205, 203, 201, 199, 197, 195, 193, 192, 189, 186, 183, 180, 177, 174, 171, 168, 165, 162, 159, 156, 153, 150, 147, 144, 141, 138, 135, 132, 129, 126, 123, 120, 117, 114, 111, 108, 105, 102, 99, 96, 93, 90, 87, 84, 81, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3],
   "red":   [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
};

// hot
dwv.image.lut.hot = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.toMaxFirstThird),
   "green": dwv.image.lut.buildLut(dwv.image.lut.toMaxSecondThird),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.toMaxThirdThird)
};

// test
dwv.image.lut.test = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.id),
   "green": dwv.image.lut.buildLut(dwv.image.lut.zero),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.zero)
};

//red
/*dwv.image.lut.red = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.max),
   "green": dwv.image.lut.buildLut(dwv.image.lut.id),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.id)
};*/
