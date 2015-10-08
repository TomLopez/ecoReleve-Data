

-------------- INSERT Deploy equipment -------------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].[Equipment]
           ([FK_Sensor]
           ,[FK_Individual]
           ,[StartDate]
           ,[Deploy])
SELECT
s.ID,
i.ID,
cv.[begin_date],
1
  FROM [ECWP_ecoReleveData].[dbo].[TObj_Objects] o 
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Obj_CaracList] cl ON o.Id_object_type = cl.fk_Object_type 
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Carac_type] ct ON cl.fk_Carac_type = ct.Carac_type_Pk
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Carac_value] cv ON o.[Object_Pk] = cv.[fk_object] and ct.Carac_type_Pk = cv.Fk_carac
  JOIN [NewModelERD].[dbo].[Individual] i ON 'eReleve_'+CONVERT(VARCHAR,o.Object_Pk) = i.Original_ID 
  JOIN [NewModelERD].[dbo].[Sensor] s ON cv.value = s.UnicName
  where Id_object_type = 1 and cv.Fk_carac = 19

Go

-------------- INSERT Remove equipment -------------------------------------------------------------------
INSERT INTO [NewModelERD].[dbo].[Equipment]
           ([FK_Sensor]
           ,[FK_Individual]
           ,[StartDate]
           ,[Deploy])
SELECT 
s.ID,
i.ID,
cv.[end_date],
0
  FROM [ECWP_ecoReleveData].[dbo].[TObj_Objects] o 
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Obj_CaracList] cl ON o.Id_object_type = cl.fk_Object_type 
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Carac_type] ct ON cl.fk_Carac_type = ct.Carac_type_Pk
  JOIN [ECWP_ecoReleveData].[dbo].[TObj_Carac_value] cv ON o.[Object_Pk] = cv.[fk_object] and ct.Carac_type_Pk = cv.Fk_carac
  JOIN [NewModelERD].[dbo].[Individual] i ON 'eReleve_'+CONVERT(VARCHAR,o.Object_Pk) = i.Original_ID 
  JOIN [NewModelERD].[dbo].[Sensor] s ON cv.value = s.UnicName
  where Id_object_type = 1 and cv.Fk_carac = 19 and cv.end_date is not NULL
