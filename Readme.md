# 3D-Model-Visualization-System


![Snipaste_2021-12-12_20-50-57](https://user-images.githubusercontent.com/96031665/145754321-ee2d6d1f-3ccd-4ca1-896b-0d1f1f1f087f.png)

- Data
  - All data are put in the datasets folder including hdr, dat, transfer function and hatching files.




- Load Data
  1. Load HDR File
  2. Load Data File




- Opacity Transfer Function Editor:

  - Add Control Point:
           1. Double click to add a new control point.
           2. If there is a point controlling the same index in opacity buffer as the new adding control point, delete the old point.

  

  - Delete Control Point:
      1. Right Click on the control point.

  

  - Move Control Point:
    	1. Drag the control point.
      2. If there is a point controlling the same index in opacity buffer as the moving control point, delete the static one.

  

- Color Transfer Function Editor:      

  - Load Transfer Function File first placed in "datasets/TransferFunctions"

      - Add Control Point:
        1. Double click on color transfer editor to add a new control point.
        2. If there is a point sharing the same section of color as the new adding control point, delete the old point.
        3. The Max number of control point is 16.

  

  - Delete Control Point:
    1. Right Click on the control point.

  

  - Move Control Point:
    1. Dragging the control point.



- Pencil Sketch Shading

  1. Load Hatching first stored in "datasets/hatching"
  2. Load Background - "datasets/hatching/paper.jpg"
  3. Check pencil sketch shading

  - The hatching texture we would use in the system is concatenated horizontally by  six different hatching.

    > To generate higher resolution of image, I  just concatenate the same hatching image as 2 by 2, 3 by 3, or even 10 by 10, and put  all of them together horizontally

  - The file name of hatching texture would be like “hatch_number.jpg”.

