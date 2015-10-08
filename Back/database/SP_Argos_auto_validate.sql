
/****** Object:  StoredProcedure [dbo].[sp_auto_validate_argosArgos_argosGPS]    Script Date: 05/10/2015 17:24:56 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[sp_auto_validate_argosArgos_argosGPS]
	@ptt int , 
	@ind int,
	@user int,
	@freq int,
	@nb_insert int OUTPUT,
	@exist int output, 
	@error int output
	
	
AS
BEGIN
---------------------------- Declaration -----------------------------------------------------------
	SET NOCOUNT ON;
	DECLARE @data_to_insert table ( 
		data_id int,FK_Sensor int, date_ datetime, lat decimal(9,5), lon decimal(9,5)
		, lc varchar(1), iq tinyint,ele int , nbMsg tinyint, nbMsg120dB tinyint
		, bestLevel smallint, passDuration	smallint,nopc tinyint,freq float
		,errorRadius int,semiMajor int,semiMinor int,orientation tinyint,hdop int , 
		speed int,course int, type_ varchar(3),
		 FK_ind int,creator int,name varchar(100)
		 );

	DECLARE @data_duplicate table ( 
		data_id int,fk_sta_id int
		);

	DECLARE @output TABLE (ind_loc_id int,data_id int,type_ varchar(3));
	DECLARE @NbINserted int ; 

WITH data AS (
		SELECT PK_ID,
			date
			, ROW_NUMBER() OVER (PARTITION BY CONVERT(DATE, date), DATEPART(hour, date),  DATEPART(minute, date)/@freq, type ORDER BY date) as r
		FROM VArgosData_With_EquipIndiv where  FK_ptt=@ptt and checked = 0 and FK_Individual = @ind
	)


------------------------------------- Check data to Inset ------------------------------------------------------------------
INSERT INTO @data_to_insert (data_id ,FK_Sensor , date_ , lat , lon , lc , iq ,ele  ,
 nbMsg , nbMsg120dB , bestLevel , passDuration	,nopc ,freq ,
 errorRadius ,semiMajor,semiMinor ,orientation ,hdop
 ,speed,course ,type_,
  FK_ind ,creator )
SELECT 
[PK_id],s.ID,[date],[lat],[lon],[lc],[iq],[ele]
,[nbMsg],[nbMsg120],[bestLevel],[passDuration],[nopc],[freq],
[errorRadius],[semiMajor],[semiMinor],[orientation],[hdop]
,[speed],[course],[type]
,@ind,@user
FROM ecoreleve_sensor.dbo.T_argosgps a
JOIN Sensor s ON a.FK_ptt = s.UnicName
WHERE PK_id in (
	select PK_ID from data where r=1
) 
and checked = 0

-- check duplicate location before insert data in @data_without_duplicate
insert into  @data_duplicate  
select d.data_id, s.ID
from @data_to_insert d join Individual_Location s on d.lat=s.LAT and d.lon = s.LON and d.date_ = s.DATE and s.FK_Individual = d.FK_ind


------------------------------------- Insert Data  ------------------------------------------------------------------
-- insert data creating new Location
INSERT INTO [dbo].[Individual_Location]
           ([LAT]
           ,[LON]
           ,[Date]
           ,[Precision]
           ,[FK_Sensor]
           ,[FK_Individual]
           ,[ELE]
           ,[creationDate]
           ,[creator]
           ,[type_]
		   ,OriginalData_ID)
select 
lat,
lon,
date_,
CASE 
	WHEN type_ = 'gps' then 
		CASE WHEN hdop is null then 26
		ELSE hdop
		END
	ELSE loc.[TLocCl_Precision]
 END
,FK_Sensor
,FK_ind
,ele
,GETDATE()
,@user
,[type_]
,'Targos_gps_'+CONVERT(VARCHAR,data_id)
from @data_to_insert i
LEFT JOIN ecoReleve_Sensor.dbo.TLocationClass loc 
ON loc.TLocCl_Classe = i.lc COLLATE SQL_Latin1_General_CP1_CI_AS
where i.data_id not in (select data_id from @data_duplicate)
SET @NbINserted=@@ROWCOUNT

update ecoreleve_sensor.dbo.T_argosgps set imported = 1 where PK_id in (select data_id from @data_to_insert)
update VArgosData_With_EquipIndiv set checked = 1 where FK_ptt = @ptt and [FK_Individual] = @ind

SET @nb_insert = @NbINserted
SELECT @exist = COUNT(*) FROM @data_duplicate
SET @error=@@ERROR

RETURN
END











GO


